import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { returnStockByOrderItem } from "@/utils/inventory"

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

    const stockDeductedStatuses = ["PENDING", "VERIFYING", "PAID", "SHIPPED", "COMPLETED"]
    const shouldRestock =
      status === "CANCELLED" &&
      stockDeductedStatuses.includes(existingOrder.status)

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
      })

      if (shouldRestock) {
        const shortOrderId = orderId.substring(0, 8).toUpperCase()
        for (const item of existingOrder.items) {
          await returnStockByOrderItem(tx, {
            orderItemId: item.id,
            profileId,
            note: `คืนสต๊อกเนื่องจากยกเลิกออเดอร์ ORD-${shortOrderId}`
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