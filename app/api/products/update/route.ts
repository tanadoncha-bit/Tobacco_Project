import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request) {
  try {
    const {
      Pid,
      name,
      images = [],
      variants = [],
      options = [],
    } = await req.json()

    if (!Pid || !name) {
      return NextResponse.json(
        { message: "Invalid payload" },
        { status: 400 }
      )
    }

    /* =======================================================
       1️⃣ Update Product
    ======================================================= */

    const operations: any[] = []

    operations.push(
      prisma.product.update({
        where: { Pid },
        data: { Pname: name },
      })
    )

    /* =======================================================
       2️⃣ Replace Images
    ======================================================= */

    operations.push(
      prisma.productImage.deleteMany({ where: { Pid } })
    )

    if (images.length > 0) {
      operations.push(
        prisma.productImage.createMany({
          data: images.map((url: string) => ({
            Pid,
            url,
          })),
        })
      )
    }

    /* =======================================================
       3️⃣ Replace Options
    ======================================================= */

    operations.push(
      prisma.productOption.deleteMany({ where: { Pid } })
    )

    // Run basic ops first
    await prisma.$transaction(operations)

    /* =======================================================
       4️⃣ Create Options + Map
    ======================================================= */

    const valueIdMap = new Map<string, number>()

    for (const opt of options) {
      const createdOption =
        await prisma.productOption.create({
          data: {
            name: opt.name,
            Pid,
          },
        })

      for (const val of opt.values ?? []) {
        const createdValue =
          await prisma.productOptionValue.create({
            data: {
              value: val.value,
              optionId: createdOption.id,
            },
          })

        valueIdMap.set(val.value, createdValue.id)
      }
    }

    /* =======================================================
       5️⃣ Replace Variants
    ======================================================= */

    await prisma.productVariant.deleteMany({
      where: { Pid },
    })

    for (const v of variants) {
      const createdVariant =
        await prisma.productVariant.create({
          data: {
            Pid,
            price: Number(v.price),
            stock: Number(v.stock),
          },
        })

      for (const val of v.values ?? []) {
        const valueString =
          val?.optionValue?.value

        const optionValueId =
          valueIdMap.get(valueString)

        if (!optionValueId) {
          throw new Error(
            `OptionValue not found for ${valueString}`
          )
        }

        await prisma.productVariantValue.create({
          data: {
            variantId: createdVariant.id,
            optionValueId,
          },
        })
      }
    }

    /* =======================================================
       6️⃣ Slip Log
    ======================================================= */

    const fullProduct =
      await prisma.product.findUnique({
        where: { Pid },
        include: {
          variants: {
            include: {
              values: {
                include: {
                  optionValue: {
                    include: {
                      option: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

    await prisma.productSlip.create({
      data: {
        Pid,
        action: "UPDATE",
        snapshot: {
          name: fullProduct?.Pname,
          images,
          variants: fullProduct?.variants,
        },
        createdBy: "Product Staff",
      },
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