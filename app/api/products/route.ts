import { NextResponse } from "next/server"
import prisma from "@/utils/db"

function generateProductCode(id: number) {
  return `TC-${String(id).padStart(4, "0")}`
}

export async function POST(req: Request) {
  try {
    const { name, imageUrls, options, variants } = await req.json()

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Create Product
      const product = await tx.product.create({
        data: { Pname: name },
      })

      // 2️⃣ Images
      if (imageUrls?.length) {
        await tx.productImage.createMany({
          data: imageUrls.map((url: string) => ({
            url,
            Pid: product.Pid,
          })),
        })
      }

      // 3️⃣ Options + OptionValues
      const optionValueMap = new Map<string, number>()

      for (const opt of options || []) {
        const createdOption = await tx.productOption.create({
          data: {
            name: opt.name,
            Pid: product.Pid,
          },
        })

        for (const v of opt.values || []) {
          const createdValue = await tx.productOptionValue.create({
            data: {
              value: v.value,
              optionId: createdOption.id,
            },
          })

          optionValueMap.set(v.value, createdValue.id)
        }
      }

      // 4️⃣ Variants + VariantValues
      for (const v of variants || []) {
        const createdVariant = await tx.productVariant.create({
          data: {
            price: v.price,
            stock: v.stock,
            Pid: product.Pid,
          },
        })

        for (const value of v.combination || []) {
          const optionValueId = optionValueMap.get(value)
          if (optionValueId) {
            await tx.productVariantValue.create({
              data: {
                variantId: createdVariant.id,
                optionValueId,
              },
            })
          }
        }
      }

      // 5️⃣ Generate productCode
      const productCode = generateProductCode(product.Pid)

      const updatedProduct = await tx.product.update({
        where: { Pid: product.Pid },
        data: { productCode },
      })

      return updatedProduct
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
