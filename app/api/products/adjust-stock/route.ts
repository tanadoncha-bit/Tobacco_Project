import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { variantId, amount, type, note } = data
    const session = await getServerSession(authOptions)

    // Validate ข้อมูลเบื้องต้น
    if (!variantId || !amount || amount <= 0) {
      return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน หรือจำนวนไม่ถูกต้อง" }, { status: 400 })
    }

    // ใช้ Prisma Transaction เพื่อให้การทำงาน 2 อย่างนี้สำเร็จพร้อมกัน (ถ้าพังก็พังคู่)
    await prisma.$transaction(async (tx) => {
      
      // 1. อัปเดตจำนวนสต๊อกในตาราง ProductVariant (ใช้วิธีบวกเพิ่ม increment)
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stock: {
            increment: amount // เอาจำนวนเดิม + จำนวนใหม่ (ปลอดภัยกว่าการเอาเลขไปทับตรงๆ)
          }
        }
      })

      // 2. บันทึกประวัติลงตาราง StockTransaction เพื่อให้ไปโผล่ในหน้า History
      await tx.stockTransaction.create({
        data: {
          variantId: variantId,
          type: type || "IN", // "IN" = รับเข้า
          amount: amount,
          note: note || "เพิ่มสต๊อกแมนนวล",
          createdBy: session?.user?.name || "Unknown" // ถ้ามีระบบ Login ค่อยดึงชื่อ User มาใส่ตรงนี้ครับ
        }
      })

    })

    return NextResponse.json({ success: true, message: "ปรับสต๊อกเรียบร้อยแล้ว" })
    
  } catch (error: any) {
    console.error("ADJUST STOCK ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการปรับสต๊อก" }, { status: 500 })
  }
}