import { NextResponse } from "next/server"
import prisma from "@/utils/db"

export async function POST(req: Request) {
  try {
    const { name, imageUrls, options, variants } = await req.json()

    // 1️⃣ Create product (ไม่ใช้ transaction)
    const product = await prisma.product.create({
      data: { Pname: name },
    })

    // 2️⃣ Images
    if (imageUrls?.length) {
      await prisma.productImage.createMany({
        data: imageUrls.map((url: string) => ({
          url,
          Pid: product.Pid,
        })),
      })
    }

    // 3️⃣ Options + OptionValues
    const optionValueMap = new Map<string, number>()

    for (const opt of options || []) {
      const option = await prisma.productOption.create({
        data: {
          name: opt.name,
          Pid: product.Pid,
        },
      })

      for (const v of opt.values || []) {
        const value = await prisma.productOptionValue.create({
          data: {
            value: v.value,
            optionId: option.id,
          },
        })

        // ใช้ key = `${optionId}:${value}`
        optionValueMap.set(`${option.id}:${v.value}`, value.id)
      }
    }

    // 4️⃣ Variants + VariantValues
    for (const v of variants || []) {
      const variant = await prisma.productVariant.create({
        data: {
          price: Number(v.price),
          stock: Number(v.stock),
          Pid: product.Pid,
        },
      })

      for (const value of v.combination || []) {
        // หา optionValueId จากทุก option
        for (const [key, optionValueId] of optionValueMap.entries()) {
          if (key.endsWith(`:${value}`)) {
            await prisma.productVariantValue.create({
              data: {
                variantId: variant.id,
                optionValueId,
              },
            })
          }
        }
      }
    }

    // 5️⃣ Generate productCode
    const updatedProduct = await prisma.product.update({
      where: { Pid: product.Pid },
      data: {
        productCode: `TC-${String(product.Pid).padStart(4, "0")}`,
      },
    })

    // 6️⃣ Create Slip
    await prisma.productSlip.create({
      data: {
        Pid: product.Pid,
        action: "CREATE",
        snapshot: {
          name,
          images: imageUrls,
          options,
          variants,
        },
        createdBy: "Product Staff",
      },
    })

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    })
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error)
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}
