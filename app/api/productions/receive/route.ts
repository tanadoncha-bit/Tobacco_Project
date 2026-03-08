import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const profileId = session?.user?.id

    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized - กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const body = await req.json()
    const { docNo, note, receivedAmount, expireDate } = body

    if (!docNo) {
      return NextResponse.json({ error: "กรุณาระบุบิลสั่งผลิตที่ต้องการรับเข้า" }, { status: 400 })
    }

    if (!receivedAmount || Number(receivedAmount) <= 0) {
      return NextResponse.json({ error: "กรุณาระบุจำนวนที่รับเข้าให้ถูกต้อง" }, { status: 400 })
    }

    const finalAmount = Number(receivedAmount)

    const order = await prisma.productionOrder.findFirst({
      where: { docNo },
      include: {
        variant: { include: { product: true } },
        materialTransactions: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: "ไม่พบข้อมูลบิลสั่งผลิตนี้ในระบบ" }, { status: 404 })
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "บิลสั่งผลิตนี้ถูกรับเข้าหรือยกเลิกไปแล้ว" }, { status: 400 })
    }

    const totalMaterialCost = order.materialTransactions.reduce((sum, tx) => sum + (tx.totalCost || 0), 0)
    const unitCost = finalAmount > 0 ? (totalMaterialCost / finalAmount) : 0
    const lotNumberForNote = `LOT-${order.docNo}`
    const finalNote = note ? ` (${note})` : ""

    const newLot = await prisma.productVariantLot.create({
      data: {
        variantId: order.variantId,
        lotNumber: lotNumberForNote,
        stock: finalAmount,
        expireDate: expireDate ? new Date(expireDate) : null,
        produceDate: new Date(),
        unitCost: Number(unitCost.toFixed(2))
      }
    })

    await prisma.productionOrder.update({
      where: { id: order.id },
      data: { status: "COMPLETED" }
    })

    await prisma.stockTransaction.create({
      data: {
        variantId: order.variantId,
        type: "IN",
        amount: finalAmount,
        reason: "PRODUCTION",
        note: `รับเข้าจากบิลผลิตรายการ: ${order.docNo} [Lot: ${lotNumberForNote}]${finalNote}`,
        profileId,
        variantLotId: newLot.id,
        productionOrderId: order.id
      }
    })

    return NextResponse.json({ message: "รับเข้าสต๊อกสินค้าเรียบร้อยแล้ว", docNo: order.docNo })

  } catch (error: any) {
    console.error("Receive Production Error:", error)
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการรับเข้าสต๊อก" }, { status: 500 })
  }
}