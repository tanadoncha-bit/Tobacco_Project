import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const profileId = session?.user?.id

    const { orderId, status } = await req.json()

    if (!orderId || !status) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    // 1. ดึงข้อมูลออเดอร์ พร้อมรายการสินค้า (Items)
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

    // 3. เริ่ม Transaction
    const result = await prisma.$transaction(async (tx) => {
      // (A) อัปเดตสถานะออเดอร์
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: status },
      })

      const shortOrderId = orderId.substring(0, 8).toUpperCase()

      // // (B) กรณีต้อง "ตัดสต๊อก" (OUT)
      // if (shouldDeductStock) {
      //   for (const item of existingOrder.items) {
      //     await tx.productVariant.update({
      //       where: { id: item.variantId },
      //       data: { stock: { decrement: item.quantity } }
      //     })

      //     await tx.stockTransaction.create({
      //       data: {
      //         variantId: item.variantId,
      //         type: "OUT",
      //         amount: item.quantity,
      //         note: `ตัดสต็อกจากออเดอร์ ORD-${shortOrderId}`,
      //         profileId: profileId 
      //       }
      //     })
      //   }
      // }

      // (C) กรณีต้อง "คืนสต๊อก" (IN)
      if (shouldRestock) {
        for (const item of existingOrder.items) {
          // เพิ่มสต๊อกกลับเข้าไป
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          })

          // บันทึกประวัติเป็น IN
          await tx.stockTransaction.create({
            data: {
              variantId: item.variantId,
              type: "IN",
              amount: item.quantity,
              note: `คืนสต๊อกเนื่องจากยกเลิก/เปลี่ยนสถานะออเดอร์ ORD-${shortOrderId}`,
              profileId: profileId 
            }
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