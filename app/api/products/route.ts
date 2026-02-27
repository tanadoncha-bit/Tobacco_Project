import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, imageUrls, options, variants } = data

    // 1. สร้างรหัสสินค้าอัตโนมัติ (เช่น P-0001)
    const count = await prisma.product.count()
    const productCode = `P-${(count + 1).toString().padStart(4, "0")}`

    const newProduct = await prisma.$transaction(async (tx) => {
      // 2. สร้าง Product หลัก
      const product = await tx.product.create({
        data: { Pname: name, productCode },
      })

      // 3. เซฟรูปภาพ
      if (imageUrls && imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: imageUrls.map((url: string) => ({ Pid: product.Pid, url })),
        })
      }

      // 4. เซฟ Options & Values
      const valueIdMap = new Map<string, number>()
      for (const opt of options || []) {
        const createdOption = await tx.productOption.create({
          data: { name: opt.name, Pid: product.Pid },
        })
        for (const val of opt.values || []) {
          const createdValue = await tx.productOptionValue.create({
            data: { value: val.value, optionId: createdOption.id },
          })
          valueIdMap.set(val.value, createdValue.id)
        }
      }

      // 5. เซฟ Variants (แบบไม่มีสูตรผลิต และสต๊อก = 0)
      for (const v of variants || []) {
        const createdVariant = await tx.productVariant.create({
          data: {
            Pid: product.Pid,
            price: Number(v.price),
            stock: 0, // 👈 บังคับเริ่มต้นที่ 0 เสมอ
          },
        })

        // ผูก Option Value เข้ากับ Variant
        for (const valName of v.combination || []) {
          const optionValueId = valueIdMap.get(valName)
          if (optionValueId) {
            await tx.productVariantValue.create({
              data: { variantId: createdVariant.id, optionValueId },
            })
          }
        }
      }

      return product
    }, 
    {
      // 🚀 พระเอกขี่ม้าขาว: ขยายเวลาให้ Transaction รันได้นานสุด 20 วินาที
      maxWait: 5000, 
      timeout: 20000 
    })

    return NextResponse.json(newProduct)
  } catch (error: any) {
    console.error("CREATE PRODUCT ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสร้างสินค้า" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { Pid: 'desc' },
      include: {
        variants: {
          include: {
            // โฟกัสตรงนี้: อ้างอิงตาม Schema 'values' ใน ProductVariant
            values: {
              include: {
                optionValue: true
              }
            },
            recipes: true // ดึงสูตรมาเช็คด้วยว่ามีหรือยัง
          }
        }
      }
    })

    // แปลงโครงสร้างให้แสดงใน Dropdown ได้ง่าย
    // 2. แปลงข้อมูล (Flatten) เพื่อให้ Frontend เอาไปแสดงใน Dropdown ได้ง่ายๆ
    const formattedProducts = products.flatMap((product) => {

      // กรณีที่ 1: สินค้าไม่มีตัวเลือกย่อย
      if (!product.variants || product.variants.length === 0) {
        return [{
          id: -1, // 👈 เปลี่ยนจาก null เป็น -1 (เพื่อให้เป็น number เหมือนกัน)
          productId: product.Pid, // 👈 เติม productId ให้หน้าตาตรงกับกรณีที่ 2
          name: `${product.Pname} (${product.productCode || 'ไม่มีรหัส'}) - ไม่มีตัวเลือก`,
          hasRecipe: false
        }]
      }

      // กรณีที่ 2: สินค้ามีตัวเลือกย่อย (Variants)
      return product.variants.map((variant) => {
        // ดึงชื่อ Option Values มาต่อกัน (เช่น "1 กิโลกรัม / องุ่น")
        const optionNames = variant.values
          ?.map((v) => v.optionValue.value)
          .join(" / ")

        const displayName = optionNames
          ? `${product.Pname} - ${optionNames} (${product.productCode || 'ไม่มีรหัส'})`
          : `${product.Pname} (${product.productCode || 'ไม่มีรหัส'})`

        return {
          id: variant.id, // เป็น number
          productId: product.Pid, // เป็น number
          name: displayName,
          hasRecipe: variant.recipes && variant.recipes.length > 0
        }
      })
    })

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error)
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" },
      { status: 500 }
    )
  }
}