import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อนเพิ่มลงตะกร้า" }, { status: 401 })
    }

    const { variantId, quantity } = await req.json()
    const parsedVariantId = parseInt(variantId, 10)

    const variant = await prisma.productVariant.findUnique({
      where: { id: parsedVariantId }
    })

    if (!variant) {
      return NextResponse.json({ message: "ไม่พบสินค้านี้ในระบบ" }, { status: 404 })
    }

    if (variant.stock < quantity) {
      return NextResponse.json({ message: `สินค้ามีไม่พอ (เหลือ ${variant.stock} ชิ้น)` }, { status: 400 })
    }

    let cart = await prisma.cart.findUnique({
      where: { profileId: session.user.id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { profileId: session.user.id }
      })
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: parsedVariantId
      }
    })

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: parsedVariantId,
          quantity: quantity
        }
      })
    }

    return NextResponse.json({ success: true, message: "เพิ่มลงตะกร้าสำเร็จ!" })


  } catch (error: any) {
    console.error("CART_ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการเพิ่มลงตะกร้า" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ items: [] })
    }

    const cart = await prisma.cart.findUnique({
      where: { profileId: session.user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  include: { images: true }
                }
              }
            }
          }
        }
      }
    })

    if (!cart) {
      return NextResponse.json({ items: [] })
    }

    return NextResponse.json({ items: cart.items })

  } catch (error) {
    console.error("CART_GET_ERROR:", error)
    return NextResponse.json({ items: [], message: "เกิดข้อผิดพลาดในการดึงตะกร้า" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ message: "กรุณาล็อกอิน" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")
    if (!itemId) return NextResponse.json({ message: "ไม่พบไอดีสินค้า" }, { status: 400 })

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true }
    })

    if (!cartItem || cartItem.cart.profileId !== session.user.id) {
      return NextResponse.json({ message: "ไม่มีสิทธิ์ลบสินค้านี้" }, { status: 403 })
    }

    await prisma.cartItem.delete({ where: { id: itemId } })

    return NextResponse.json({ success: true, message: "ลบสินค้าสำเร็จ" })

  } catch (error) {
    console.error("DELETE_CART_ITEM_ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาด" }, { status: 500 })
  }
}