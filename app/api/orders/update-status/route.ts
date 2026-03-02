import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { returnStockToLatestLot } from "@/utils/inventory"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const profileId = session?.user?.id

    const { orderId, status } = await req.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "ไม่พบออเดอร์นี้" }, { status: 404 })
    }

    const closingStatuses = ["SHIPPED", "COMPLETED", "PENDING", "VERIFYING", "PAID"]

    const shouldDeductStock =
      closingStatuses.includes(status) &&
      !closingStatuses.includes(existingOrder.status)

    const shouldRestock =
      !closingStatuses.includes(status) &&
      closingStatuses.includes(existingOrder.status)

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: status },
      })

      const shortOrderId = orderId.substring(0, 8).toUpperCase()

      if (shouldRestock) {
        for (const item of existingOrder.items) {

          await returnStockToLatestLot(tx, {
            variantId: item.variantId,
            amountToReturn: item.quantity,
            profileId: profileId,
            note: `คืนสต๊อกเนื่องจากยกเลิก/เปลี่ยนสถานะออเดอร์ ORD-${shortOrderId}`
          })

        }
      }

      return updatedOrder
    })

    return NextResponse.json({ success: true, order: result })
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error)
    return NextResponse.json({ error: "ไม่สามารถอัปเดตสถานะได้" }, { status: 500 })
  }
}