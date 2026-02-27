import prisma from "@/utils/db"
import { NextResponse } from "next/server"

// ================= 1. ดึงข้อมูลสินค้าเก่ามาแสดง (GET) =================
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const productId = Number(resolvedParams.id)

    const product = await prisma.product.findUnique({
      where: { Pid: productId },
      include: {
        images: true, 
        Option: { include: { values: true } }, 
        variants: {
          include: {
            values: { include: { optionValue: true } },
            recipes: true, 
          },
        },
      },
    })
    
    if (!product) return NextResponse.json({ message: "ไม่พบสินค้า" }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json({ message: "ดึงข้อมูลล้มเหลว" }, { status: 500 })
  }
}

// ================= 2. บันทึกข้อมูลที่แก้ไข (PUT) =================
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const productId = Number(resolvedParams.id)
    
    const data = await req.json()

    // 🌟 1. ขยายเวลา Timeout และ MaxWait เพื่อป้องกัน Error P2028
    await prisma.$transaction(async (tx) => {
      // 1. อัปเดตชื่อสินค้า
      await tx.product.update({
        where: { Pid: productId },
        data: { Pname: data.name },
      })

      // 2. จัดการรูปภาพ (ถ้ามีการอัปโหลดรูปใหม่เข้ามา)
      if (data.imageUrl) {
        await tx.productImage.deleteMany({ where: { Pid: productId } })
        await tx.productImage.create({
          data: { url: data.imageUrl, Pid: productId }
        })
      }

      // 3. จัดการหัวข้อตัวเลือก (Dynamic Options)
      await tx.productOption.deleteMany({ where: { Pid: productId } })

      const createdOptions = []
      for (const optName of data.options) {
        const newOpt = await tx.productOption.create({
          data: { name: optName, Pid: productId }
        })
        createdOptions.push(newOpt)
      }

      // 🌟 2. ตัวช่วยเร่งความเร็ว (Cache) เพื่อไม่ให้ลูปมันช้าเกินไปจน Timeout
      // จำว่าค่าไหน (เช่น "สีแดง") สร้างไปแล้ว จะได้ไม่ต้อง Query DB ซ้ำ
      const optionValueCache = new Map<string, number>()

      // 🌟 4. จัดการรายการสินค้าย่อย (Variants)
      
      // 4.1: ค้นหาว่า Frontend ส่ง Variant ID ไหนมาบ้าง (เพื่อเก็บไว้)
      const incomingVariantIds = data.variants
        .map((v: any) => v.id)
        .filter((id: any) => id && !String(id).startsWith('new-'))

      // 4.2: สั่งลบแถวที่ไม่มีในรายชื่อ (แปลว่าถูกกดถังขยะทิ้งไปแล้ว)
      await tx.productVariant.deleteMany({
        where: {
          Pid: productId,
          ...(incomingVariantIds.length > 0 ? { id: { notIn: incomingVariantIds } } : {})
        }
      })

      // 4.3: อัปเดต/สร้าง แถวที่เหลืออยู่
      for (const v of data.variants) {
        let currentVariantId = v.id;

        if (!currentVariantId || String(currentVariantId).startsWith('new-')) {
          const newVar = await tx.productVariant.create({
            data: { Pid: productId, price: Number(v.price), stock: 0 }
          })
          currentVariantId = newVar.id
        } else {
          await tx.productVariant.update({
            where: { id: currentVariantId },
            data: { price: Number(v.price) }
          })
        }

        // 5. ผูกค่า (Values) ของแต่ละแถว เข้ากับหัวข้อ (Options)
        for (let i = 0; i < data.options.length; i++) {
          // 🛠️ แก้ให้รับค่าว่างได้เลย ถ้าเขาลบตัวหนังสือทิ้งไป 
          const valString = v.values[i] !== undefined ? String(v.values[i]).trim() : ""
          const optionGroup = createdOptions[i]
          
          const cacheKey = `${optionGroup.id}-${valString}`
          let optValId = optionValueCache.get(cacheKey)

          if (!optValId) {
            let optVal = await tx.productOptionValue.findFirst({
              where: { optionId: optionGroup.id, value: valString }
            })

            if (!optVal) {
              optVal = await tx.productOptionValue.create({
                data: { optionId: optionGroup.id, value: valString }
              })
            }
            optValId = optVal.id
            optionValueCache.set(cacheKey, optValId)
          }

          await tx.productVariantValue.create({
            data: { variantId: currentVariantId, optionValueId: optValId }
          })
        }
      }
    }, {
      maxWait: 5000, // รอคิวเข้าทำ transaction สูงสุด 5 วิ
      timeout: 15000 // 🌟 ให้เวลาทำงานใน transaction สูงสุด 15 วิ (แก้ต้นตอ P2028)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("UPDATE ERROR:", error)
    return NextResponse.json({ message: "อัปเดตไม่สำเร็จ", error: String(error) }, { status: 500 })
  }
}