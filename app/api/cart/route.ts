import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // 1. เช็คว่าลูกค้า Login หรือยัง
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "กรุณาเข้าสู่ระบบก่อนเพิ่มลงตะกร้า" }, { status: 401 })
    }

    // 2. รับข้อมูลที่ส่งมาจากปุ่ม AddToCart
    const body = await req.json()
    const { variantId, quantity } = body

    if (!variantId || !quantity) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    // 3. หาตะกร้าของลูกค้าคนนี้ (ถ้าไม่เคยมีตะกร้าเลย ให้สร้างใหม่)
    let cart = await prisma.cart.findUnique({
      where: { profileId: session.user.id }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: { profileId: session.user.id }
      })
    }

    // 4. เช็คว่าสินค้านี้เคยอยู่ในตะกร้าแล้วหรือยัง?
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: variantId
      }
    })

    if (existingItem) {
      // ถ้ามีอยู่แล้ว -> อัปเดตจำนวน (เอาของเดิม + ของใหม่)
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      // ถ้ายังไม่มี -> สร้างรายการใหม่ลงในตะกร้า
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: variantId,
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
    
    // ถ้ายังไม่ได้ล็อกอิน ให้ส่งตะกร้าว่างๆ กลับไป
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] })
    }

    // ดึงข้อมูลตะกร้าของ user คนนี้
    const cart = await prisma.cart.findUnique({
      where: { profileId: session.user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  // สำคัญมาก: ต้อง include images มาด้วย รูปถึงจะไปโชว์ใน Popup ตะกร้า
                  include: { images: true } 
                }
              }
            }
          }
        }
      }
    })

    // ถ้าไม่เคยมีตะกร้าเลย
    if (!cart) {
      return NextResponse.json({ items: [] })
    }

    // ส่งรายการสินค้ากลับไปให้หน้าบ้าน
    return NextResponse.json({ items: cart.items })

  } catch (error) {
    console.error("CART_GET_ERROR:", error)
    return NextResponse.json({ items: [], message: "เกิดข้อผิดพลาดในการดึงตะกร้า" }, { status: 500 })
  }
}

// ลบสินค้าออกจากตะกร้า
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "กรุณาล็อกอิน" }, { status: 401 })
    }

    // ดึง itemId จาก URL (เช่น /api/cart?itemId=5)
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get("itemId")

    if (!itemId) {
      return NextResponse.json({ message: "ไม่พบไอดีสินค้าที่ต้องการลบ" }, { status: 400 })
    }

    // ลบ CartItem ออกจาก Database
    await prisma.cartItem.delete({
      where: {
        id: itemId
      }
    })

    return NextResponse.json({ success: true, message: "ลบสินค้าสำเร็จ" })

  } catch (error) {
    console.error("DELETE_CART_ITEM_ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการลบสินค้า" }, { status: 500 })
  }
}