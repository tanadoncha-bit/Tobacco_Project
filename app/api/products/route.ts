import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { name, imageUrls, options, variants } = data

    const count = await prisma.product.count()
    const productCode = `P-${(count + 1).toString().padStart(4, "0")}`

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { Pname: name, productCode },
      })

      if (imageUrls && imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: imageUrls.map((url: string) => ({ Pid: product.Pid, url })),
        })
      }

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

      for (const v of variants || []) {
        const createdVariant = await tx.productVariant.create({
          data: {
            Pid: product.Pid,
            price: Number(v.price),
          },
        })


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
            values: {
              include: {
                optionValue: true
              }
            },
            recipes: true
          }
        }
      }
    })

    const formattedProducts = products.flatMap((product) => {

      if (!product.variants || product.variants.length === 0) {
        return [{
          id: -1,
          productId: product.Pid,
          name: `${product.Pname} (${product.productCode || 'ไม่มีรหัส'}) - ไม่มีตัวเลือก`,
          hasRecipe: false
        }]
      }

      return product.variants.map((variant) => {
        const optionNames = variant.values
          ?.map((v) => v.optionValue.value)
          .join(" / ")

        const displayName = optionNames
          ? `${product.Pname} - ${optionNames} (${product.productCode || 'ไม่มีรหัส'})`
          : `${product.Pname} (${product.productCode || 'ไม่มีรหัส'})`

        return {
          id: variant.id,
          productId: product.Pid,
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