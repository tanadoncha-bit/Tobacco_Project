import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const profileId = session?.user?.id

    if (!profileId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { materialId, type, amount, totalCost, note, lotNumber, expireDate, materialLotId } = await req.json()

    if (!materialId || !type || !amount || Number(amount) <= 0) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง" }, { status: 400 })
    }

    const numericAmount = Number(amount)

    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({
        where: { id: Number(materialId) },
        include: { MaterialLot: { where: { stock: { gt: 0 } } } }
      })

      if (!material) throw new Error("ไม่พบข้อมูลวัตถุดิบนี้ในระบบ")

      // คำนวณ stock รวมจาก lot
      const totalStock = material.MaterialLot.reduce((sum, l) => sum + l.stock, 0)

      const transactions: any[] = []

      // ── IN ──────────────────────────────────────────
      if (type === "IN") {
        if (!totalCost || Number(totalCost) <= 0) throw new Error("กรุณาระบุต้นทุนรวม (totalCost)")

        const numericTotalCost = Number(totalCost)
        const lotCostPerUnit = numericTotalCost / numericAmount

        const finalLotNumber = lotNumber || `LOT-${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`

        const lot = await tx.materialLot.upsert({
          where: { materialId_lotNumber: { materialId: Number(materialId), lotNumber: finalLotNumber } },
          update: {
            stock: { increment: numericAmount },
            costPerUnit: lotCostPerUnit,
            expireDate: expireDate ? new Date(expireDate) : null,
          },
          create: {
            materialId: Number(materialId),
            lotNumber: finalLotNumber,
            stock: numericAmount,
            costPerUnit: lotCostPerUnit,
            expireDate: expireDate ? new Date(expireDate) : null,
          },
        })

        // อัปเดต costPerUnit ใน material (weighted average)
        const oldTotalValue = totalStock * (material.costPerUnit ?? 0)
        const newTotalStock = totalStock + numericAmount
        const newAvgCost = (oldTotalValue + numericTotalCost) / newTotalStock

        await tx.material.update({
          where: { id: Number(materialId) },
          data: { costPerUnit: newAvgCost }
        })

        const transaction = await tx.materialTransaction.create({
          data: {
            materialId: Number(materialId),
            materialLotId: lot.id,
            type: "IN",
            reason: "NEW_PURCHASE",
            amount: numericAmount,
            totalCost: numericTotalCost,
            note: `รับเข้า ${material.name} [${lot.lotNumber}] จำนวน ${numericAmount} ${material.unit}${note ? ` จาก ${note}` : ""}`,
            profileId,
          },
        })
        transactions.push(transaction)
      }

      // ── OUT ─────────────────────────────────────────
      else if (type === "OUT") {
        if (totalStock < numericAmount) throw new Error(`สต๊อกคงเหลือมีเพียง ${totalStock} ${material.unit}`)

        // เลือกล็อตเอง
        if (materialLotId !== null && materialLotId !== undefined) {
          const specificLot = await tx.materialLot.findUnique({ where: { id: Number(materialLotId) } })
          if (!specificLot) throw new Error("ไม่พบล็อตที่เลือก")
          if (specificLot.materialId !== Number(materialId)) throw new Error("ล็อตนี้ไม่ใช่ของวัตถุดิบนี้")
          if (specificLot.stock < numericAmount) throw new Error(`สต๊อกในล็อตนี้มีเพียง ${specificLot.stock}`)

          await tx.materialLot.update({
            where: { id: specificLot.id },
            data: { stock: { decrement: numericAmount } },
          })

          const transaction = await tx.materialTransaction.create({
            data: {
              materialId: Number(materialId),
              materialLotId: specificLot.id,
              type: "OUT",
              reason: "ADJUSTMENT",
              amount: numericAmount,
              totalCost: null,
              note: `เบิก ${material.name} [${specificLot.lotNumber}] ออก${note ? ` เนื่องจาก ${note}` : ""}`,
              profileId,
            },
          })
          transactions.push(transaction)
        }

        // FEFO อัตโนมัติ
        else {
          const availableLots = await tx.materialLot.findMany({
            where: { materialId: Number(materialId), stock: { gt: 0 } },
            orderBy: [{ expireDate: "asc" }, { receiveDate: "asc" }],
          })

          if (availableLots.length === 0) throw new Error("ไม่มีล็อตที่ใช้งานได้")

          let remaining = numericAmount
          for (const lot of availableLots) {
            if (remaining <= 0) break
            const deductAmount = Math.min(lot.stock, remaining)
            remaining -= deductAmount

            await tx.materialLot.update({
              where: { id: lot.id },
              data: { stock: { decrement: deductAmount } },
            })

            const transaction = await tx.materialTransaction.create({
              data: {
                materialId: Number(materialId),
                materialLotId: lot.id,
                type: "OUT",
                reason: "ADJUSTMENT",
                amount: deductAmount,
                totalCost: null,
                note: `เบิก ${material.name} [${lot.lotNumber}] ออก${note ? ` เนื่องจาก ${note}` : ""}`,
                profileId,
              },
            })
            transactions.push(transaction)
          }

          if (remaining > 0) throw new Error("ล็อตไม่เพียงพอ")
        }
      }

      return { transactions }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("MATERIAL TRANSACTION ERROR:", error)
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 400 })
  }
}