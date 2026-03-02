import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { NextResponse } from "next/server"
import { deductStockFIFO } from "@/utils/inventory"

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const cart = await prisma.cart.findUnique({
      where: { profileId: userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                recipes: true,
              },
            },
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ message: "ตะกร้าว่างเปล่า" }, { status: 400 })
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * (item.variant.price ?? 0),
      0
    )

    const order = await prisma.$transaction(async (tx) => {

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
      for (const item of cart.items) {

        await deductStockFIFO(tx, {
          variantId: item.variantId,
          amountToDeduct: item.quantity,
          profileId: userId,
          note: `ขายสินค้า Order ORD-${shortOrderId}`
        })

      }

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