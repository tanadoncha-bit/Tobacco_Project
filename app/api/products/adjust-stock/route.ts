import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { variantId, amount, type, note } = data
    
    const session = await getServerSession(authOptions)
    
    const profileId = session?.user?.id 

    if (!variantId || !amount || amount <= 0) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน หรือจำนวนไม่ถูกต้อง" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stock: {
            increment: amount 
          }
        }
      })

      await tx.stockTransaction.create({
        data: {
          variantId: variantId,
          type: type || "IN", 
          amount: amount,
          note: note || "เพิ่มสต๊อกแมนนวล",
          profileId: profileId,
        }
      })
    })

    return NextResponse.json({ success: true, message: "ปรับสต๊อกเรียบร้อยแล้ว" })
    
  } catch (error: any) {
    console.error("ADJUST STOCK ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการปรับสต๊อก" }, { status: 500 })
  }
}