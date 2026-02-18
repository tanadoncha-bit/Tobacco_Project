import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request) {
  try {
    const { Pid, name, images, variants, options } = await req.json()

    await prisma.$transaction(async (tx) => {
      // 1️⃣ Update product
      await tx.product.update({
        where: { Pid },
        data: { Pname: name },
      })

      // 2️⃣ Replace images
      await tx.productImage.deleteMany({ where: { Pid } })
      if (images?.length) {
        await tx.productImage.createMany({
          data: images.map((url: string) => ({ Pid, url })),
        })
      }

      // 3️⃣ Existing variants
      const existingVariants = await tx.productVariant.findMany({
        where: { Pid },
        select: { id: true },
      })

      const incomingIds = variants
        .filter((v: any) => typeof v.id === "number")
        .map((v: any) => v.id)

      const toDelete = existingVariants
        .filter(v => !incomingIds.includes(v.id))
        .map(v => v.id)

      if (toDelete.length) {
        await tx.productVariantValue.deleteMany({
          where: { variantId: { in: toDelete } },
        })

        await tx.productVariant.deleteMany({
          where: { id: { in: toDelete } },
        })
      }

      // 4️⃣ Create / Update variants
      for (const v of variants) {
        // CREATE
        if (!v.id) {
          const newVariant = await tx.productVariant.create({
            data: {
              Pid,
              price: Number(v.price),
              stock: Number(v.stock),
            },
          })

          for (const val of v.values) {
            const optionValue = await tx.productOptionValue.create({
              data: {
                value: val.optionValue.value,
                optionId: val.optionId,
              },
            })

            await tx.productVariantValue.create({
              data: {
                variantId: newVariant.id,
                optionValueId: optionValue.id,
              },
            })
          }
        }

        // UPDATE
        else {
          await tx.productVariant.update({
            where: { id: v.id },
            data: {
              price: Number(v.price),
              stock: Number(v.stock),
            },
          })
        }
      }

      // 5️⃣ Clean orphan optionValues
      await tx.productOptionValue.deleteMany({
        where: {
          variantValues: { none: {} },
          option: { product: { Pid } },
        },
      })

      // 6️⃣ Slip
      await tx.productSlip.create({
        data: {
          Pid,
          action: "UPDATE",
          snapshot: {
            name,
            images,
            options,
            variants,
          },
          createdBy: "Product Staff",
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("UPDATE PRODUCT ERROR:", err)
    return NextResponse.json(
      { message: err.message },
      { status: 500 }
    )
  }
}
