import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

const prisma = new PrismaClient()

const REASON_TEXT: Record<string, string> = {
  "NEW_PURCHASE": "รับเข้าสินค้าใหม่",
  "PRODUCTION": "รับเข้าจากการผลิต",
  "RETURN": "ลูกค้านำสินค้ามาคืน",
  "AUDIT": "ปรับยอดสต๊อก (นับเกิน)",
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized - กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const body = await req.json()
    const { variantId, amount, type, reason, note, lotNumber, expireDate, unitCost, variantLotId } = body

    if (!variantId || !amount || !type || !reason) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน (กรุณาระบุสาเหตุให้ครบ)" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      let currentLotId: number | null = null
      let lotNumberForNote = ""

      if (type === "IN" && (reason === "NEW_PURCHASE" || reason === "PRODUCTION")) {
        // สร้าง/อัปเดต lot ใหม่
        const currentLotNumber = lotNumber || `LOT-${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`
        lotNumberForNote = currentLotNumber

        const existingLot = await tx.productVariantLot.findUnique({
          where: { variantId_lotNumber: { variantId: Number(variantId), lotNumber: currentLotNumber } }
        })

        if (existingLot) {
          const updatedLot = await tx.productVariantLot.update({
            where: { id: existingLot.id },
            data: { stock: { increment: Number(amount) } }
          })
          currentLotId = updatedLot.id
        } else {
          const newLot = await tx.productVariantLot.create({
            data: {
              variantId: Number(variantId),
              lotNumber: currentLotNumber,
              stock: Number(amount),
              expireDate: expireDate ? new Date(expireDate) : null,
              produceDate: new Date(),
              unitCost: unitCost != null ? Number(unitCost) : null,
            }
          })
          currentLotId = newLot.id
        }

      } else if (type === "IN" && reason === "RETURN" && variantLotId) {
        // คืนสินค้าเข้า lot เดิมที่เคยเบิกออก
        const lot = await tx.productVariantLot.findUnique({ where: { id: Number(variantLotId) } })
        if (!lot) throw new Error("ไม่พบ Lot ที่ระบุ")

        const updatedLot = await tx.productVariantLot.update({
          where: { id: lot.id },
          data: { stock: { increment: Number(amount) } }
        })
        currentLotId = updatedLot.id
        lotNumberForNote = lot.lotNumber || `LOT-${lot.id}`

      } else if (type === "IN" && reason === "RETURN" && !variantLotId) {
        // RETURN โดยไม่ระบุ lot — คืนเข้า lot ล่าสุดของ variant นั้น
        const latestLot = await tx.productVariantLot.findFirst({
          where: { variantId: Number(variantId) },
          orderBy: { id: "desc" }
        })
        if (latestLot) {
          await tx.productVariantLot.update({
            where: { id: latestLot.id },
            data: { stock: { increment: Number(amount) } }
          })
          currentLotId = latestLot.id
          lotNumberForNote = latestLot.lotNumber || `LOT-${latestLot.id}`
        }
      } else if (type === "IN" && reason === "AUDIT" && variantLotId) {
        // ปรับยอดเข้า lot ที่เลือก
        const lot = await tx.productVariantLot.findUnique({ where: { id: Number(variantLotId) } })
        if (!lot) throw new Error("ไม่พบ Lot ที่ระบุ")

        const updatedLot = await tx.productVariantLot.update({
          where: { id: lot.id },
          data: { stock: { increment: Number(amount) } }
        })
        currentLotId = updatedLot.id
        lotNumberForNote = lot.lotNumber || `LOT-${lot.id}`
      }

      let generatedNote = REASON_TEXT[reason] || "ปรับสต๊อก"
      if (lotNumberForNote) generatedNote += ` [Lot: ${lotNumberForNote}]`

      const transaction = await tx.stockTransaction.create({
        data: {
          variantId: Number(variantId),
          amount: Number(amount),
          type: type,
          reason: reason,
          note: generatedNote,
          profileId: session.user.id,
          variantLotId: currentLotId
        }
      })

      return { transaction }
    })

    return NextResponse.json({ success: true, transaction: result.transaction })

  } catch (error: any) {
    console.error("Adjust Stock Error:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการปรับสต็อก", error: error.message }, { status: 500 })
  }
}