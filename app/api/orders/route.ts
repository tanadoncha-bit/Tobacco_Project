export const dynamic = "force-dynamic";

import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // 1. ดึงตะกร้า + สูตรวัตถุดิบ (Recipe) ของแต่ละ Variant มาด้วย
    const cart = await prisma.cart.findUnique({
      where: { profileId: userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                recipes: true, // ดึงสูตรมาแล้ว
              },
            },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: "ตะกร้าว่างเปล่า" }, { status: 400 })
    }

    // 2. คำนวณยอดรวม
    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * (item.variant.price ?? 0),
      0
    )

    // 3. ใช้ Transaction เพื่อความปลอดภัย
    const order = await prisma.$transaction(async (tx) => {

      // 3.1 สร้าง Order
      const newOrder = await tx.order.create({
        data: {
          profileId: userId,
          totalAmount,
          status: "PENDING",
          items: {
            createMany: {
              data: cart.items.map((item) => ({
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.variant.price ?? 0,
              })),
            },
          },
        },
      })

      const shortOrderId = newOrder.id.substring(0, 8).toUpperCase()
      // 3.2 ตัดสต๊อกสินค้าหลัก (ProductVariant) และจดประวัติ
      for (const item of cart.items) {
        
        // อัปเดตสต๊อกสินค้าลดลง
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })

        // 🚨 [แก้ไขแล้ว] บันทึกประวัติโดยใช้ profileId แทน createdBy
        await tx.stockTransaction.create({
          data: {
            variantId: item.variantId,
            type: "OUT",
            amount: item.quantity,
            note: `ขายสินค้า Order ORD-${shortOrderId}`,
            profileId: userId,
          }
        })
      }

      // 3.4 ล้างตะกร้า
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      })

      return newOrder
    })

    return NextResponse.json({ success: true, order })

  } catch (error: any) {
    console.error("CHECKOUT_ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสั่งซื้อ" }, { status: 500 })
  }
}