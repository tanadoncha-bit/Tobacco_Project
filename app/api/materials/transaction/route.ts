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

    const {
      materialId,
      type,
      amount,
      totalCost,
      note,
      lotNumber,
      expireDate,
      materialLotId,
    } = await req.json()

    if (!materialId || !type || !amount || Number(amount) <= 0) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)

    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({
        where: { id: Number(materialId) },
      })

      if (!material) {
        throw new Error("ไม่พบข้อมูลวัตถุดิบนี้ในระบบ")
      }

      let newStock = material.stock
      let newAvgCost = material.costPerUnit ?? 0
      const transactions: any[] = []

      const reasonText = note ? ` จาก ${note}` : ""

      /* ===============================
         IN
      =============================== */
      if (type === "IN") {
        if (!totalCost || Number(totalCost) <= 0) {
          throw new Error("กรุณาระบุต้นทุนรวม (totalCost)")
        }

        const numericTotalCost = Number(totalCost)

        const oldStock = material.stock
        const oldAvg = material.costPerUnit ?? 0

        const oldTotalValue = oldStock * oldAvg
        const newTotalValue = oldTotalValue + numericTotalCost

        newStock = oldStock + numericAmount
        newAvgCost = newTotalValue / newStock

        const finalLotNumber =
          lotNumber ||
          `LOT-${new Date()
            .toISOString()
            .replace(/[-:T.]/g, "")
            .slice(0, 14)}`

        const lotCostPerUnit = numericTotalCost / numericAmount

        const lot = await tx.materialLot.upsert({
          where: {
            materialId_lotNumber: {
              materialId: Number(materialId),
              lotNumber: finalLotNumber,
            },
          },
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

        const transaction = await tx.materialTransaction.create({
          data: {
            materialId: Number(materialId),
            materialLotId: lot.id,
            type,
            amount: numericAmount,
            totalCost: numericTotalCost,
            note: `รับเข้า ${material.name} [${lot.lotNumber}] จำนวน ${numericAmount} ${material.unit} ${note ? ` จาก ${note}` : ""}`,
            profileId,
          },
        })

        transactions.push(transaction)
      }

      /* ===============================
         OUT
      =============================== */
      else if (type === "OUT") {
        if (material.stock < numericAmount) {
          throw new Error(
            `สต๊อกคงเหลือมีเพียง ${material.stock} ${material.unit}`
          )
        }

        // 🔹 เลือกล็อตเอง
        if (materialLotId !== null && materialLotId !== undefined) {
          const specificLot = await tx.materialLot.findUnique({
            where: { id: Number(materialLotId) },
          })

          if (!specificLot) {
            throw new Error("ไม่พบล็อตที่เลือก")
          }

          if (specificLot.materialId !== Number(materialId)) {
            throw new Error("ล็อตนี้ไม่ใช่ของวัตถุดิบนี้")
          }

          if (specificLot.stock < numericAmount) {
            throw new Error(
              `สต๊อกในล็อตนี้มีเพียง ${specificLot.stock}`
            )
          }

          await tx.materialLot.update({
            where: { id: specificLot.id },
            data: { stock: { decrement: numericAmount } },
          })

          const transaction = await tx.materialTransaction.create({
            data: {
              materialId: Number(materialId),
              materialLotId: specificLot.id,
              type,
              amount: numericAmount,
              totalCost: null,
              note: `เบิก ${material.name} [${specificLot.lotNumber}] ออก ${note ? ` เนื่องจาก ${note}` : ""}`,
              profileId,
            },
          })

          transactions.push(transaction)
        }

        // 🔹 FIFO
        else {
          const availableLots = await tx.materialLot.findMany({
            where: {
              materialId: Number(materialId),
              stock: { gt: 0 },
            },
            orderBy: [
              { expireDate: "asc" },
              { receiveDate: "asc" },
            ],
          })

          if (availableLots.length === 0) {
            throw new Error("ไม่มีล็อตที่ใช้งานได้")
          }

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
                type,
                amount: deductAmount,
                totalCost: null,
                note: `เบิก ${material.name} [${lot.lotNumber}] ออก ${note ? ` เนื่องจาก ${note}` : ""}`,
                profileId,
              },
            })

            transactions.push(transaction)
          }

          if (remaining > 0) {
            throw new Error("ล็อตไม่เพียงพอ")
          }
        }

        newStock = material.stock - numericAmount
      }

      const updatedMaterial = await tx.material.update({
        where: { id: Number(materialId) },
        data: {
          stock: newStock,
          costPerUnit: newAvgCost,
        },
      })

      return { updatedMaterial, transactions }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("MATERIAL TRANSACTION ERROR:", error)

    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 400 }
    )
  }
}