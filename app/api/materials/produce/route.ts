// app/api/materials/produce/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db" // 🚨 ใช้ prisma จาก utils/db ที่มีอยู่แล้วดีกว่าครับ ป้องกัน Connection เต็ม

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    // 🚨 ดึง ID ของ User ที่ทำรายการจาก Session
    const profileId = session?.user?.id 

    const body = await req.json()
    const { variantId, produceAmount, note } = body

    if (!variantId || !produceAmount || produceAmount <= 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง กรุณาระบุตัวเลือกสินค้า (Variant)" }, { status: 400 })
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: Number(variantId) },
      include: { recipes: true, product: true }
    })

    if (!variant) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสินค้าย่อย (Variant)" }, { status: 404 })
    }

    if (!variant.recipes || variant.recipes.length === 0) {
      return NextResponse.json({ error: "ไม่พบสูตรการผลิตสำหรับสินค้านี้ กรุณาตั้งค่าสูตรก่อน" }, { status: 400 })
    }

    // ==========================================
    // ใช้ Transaction: ทำงานรวดเดียว ถ้าพังกลางทางจะ Rollback ไม่บันทึกเลย
    // ==========================================
    await prisma.$transaction(async (tx) => {
      // 2. ตรวจสอบสต๊อกวัตถุดิบทั้งหมดก่อนว่าพอผลิตหรือไม่
      for (const recipe of variant.recipes) {
        const requiredAmount = recipe.quantity * Number(produceAmount)

        const material = await tx.material.findUnique({
          where: { id: recipe.materialId }
        })

        if (!material) {
          throw new Error("ไม่พบข้อมูลวัตถุดิบในระบบ")
        }

        if (material.stock < requiredAmount) {
          throw new Error(`วัตถุดิบ "${material.name}" ไม่เพียงพอ (ต้องการ ${requiredAmount} ${material.unit} แต่มีแค่ ${material.stock} ${material.unit})`)
        }
      }

      // 3. หักสต๊อกวัตถุดิบ และบันทึกประวัติ (MaterialTransaction)
      for (const recipe of variant.recipes) {
        const requiredAmount = recipe.quantity * Number(produceAmount)

        await tx.material.update({
          where: { id: recipe.materialId },
          data: { stock: { decrement: requiredAmount } }
        })

        await tx.materialTransaction.create({
          data: {
            materialId: recipe.materialId,
            type: "OUT",
            amount: requiredAmount,
            note: `เบิกผลิต ${variant.product.Pname} จำนวน ${produceAmount} ชิ้น ${note ? `(หมายเหตุ: ${note})` : ""}`,
            profileId: profileId // 🚨 เปลี่ยนมาใช้ profileId เชื่อมกับตาราง Profile
          }
        })
      }
    })

    // 5. ดึงข้อมูล Material อัปเดตล่าสุด กลับไปให้หน้าบ้าน render ตารางใหม่
    const updatedMaterials = await prisma.material.findMany({
      orderBy: { id: 'desc' }
    })

    return NextResponse.json(updatedMaterials)

  } catch (error: any) {
    console.error("Produce Error:", error)
    // คืนค่า Error Message กลับไปให้ Frontend (toast.error จะรับข้อความนี้ไปแสดง)
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการผลิต" }, { status: 500 })
  }
}