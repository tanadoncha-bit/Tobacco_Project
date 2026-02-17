import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function PUT(req: Request) {
  try {
    const { Pid, name, images, variants } = await req.json()

    // ===== UPDATE PRODUCT =====
    await prisma.product.update({
      where: { Pid },
      data: { Pname: name },
    })

    // ===== REPLACE IMAGES =====
    await prisma.productImage.deleteMany({ where: { Pid } })
    if (images?.length) {
      await prisma.productImage.createMany({
        data: images.map((url: string) => ({ Pid, url })),
      })
    }

    // ===== HANDLE VARIANTS =====
    const existing = await prisma.productVariant.findMany({
      where: { Pid },
      select: { id: true },
    })

    const incomingIds = variants
      .filter((v: any) => typeof v.id === "number")
      .map((v: any) => v.id)

    // ลบ variant ที่ถูกลบใน UI
    const toDelete = existing
      .filter((v) => !incomingIds.includes(v.id))
      .map((v) => v.id)

    if (toDelete.length) {
      // หา optionValue ที่ผูกกับ variant ที่จะลบ
      const variantValues = await prisma.productVariantValue.findMany({
        where: { variantId: { in: toDelete } },
        select: { optionValueId: true },
      })

      const optionValueIds = variantValues.map(v => v.optionValueId)

      // ลบความสัมพันธ์ก่อน
      await prisma.productVariantValue.deleteMany({
        where: { variantId: { in: toDelete } },
      })

      // ลบ variant
      await prisma.productVariant.deleteMany({
        where: { id: { in: toDelete } },
      })
    }


    // ===== CREATE / UPDATE =====
    for (const v of variants) {
      // ---------- CREATE ----------
      if (v.id == null) {
        const newVariant = await prisma.productVariant.create({
          data: {
            Pid,
            price: v.price,
            stock: v.stock,
          },
        })

        for (const val of v.values) {
          const optionValue = await prisma.productOptionValue.create({
            data: {
              value: val.optionValue.value,
              optionId: val.optionId,
            },
          })

          await prisma.productVariantValue.create({
            data: {
              variantId: newVariant.id,
              optionValueId: optionValue.id,
            },
          })
        }
      }

      // ---------- UPDATE ----------
      else {
        await prisma.productVariant.update({
          where: { id: v.id },
          data: {
            price: v.price,
            stock: v.stock,
          },
        })

        for (const val of v.values) {
          if (val.optionValueId) {
            await prisma.productOptionValue.update({
              where: { id: val.optionValueId },
              data: { value: val.optionValue.value },
            })
          }
        }
      }
    }

    await prisma.productOptionValue.deleteMany({
      where: {
        variantValues: {
          none: {}, // ไม่มี variant ใช้งานแล้ว
        },
        option: {
          product: {
            Pid,
          },
        },
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
