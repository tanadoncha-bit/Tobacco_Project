import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const productId = Number(resolvedParams.id)
    
    const data = await req.json()

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { Pid: productId },
        data: { Pname: data.name },
      })

      if (data.imageUrl) {
        await tx.productImage.deleteMany({ where: { Pid: productId } })
        await tx.productImage.create({
          data: { url: data.imageUrl, Pid: productId }
        })
      }

      await tx.productOption.deleteMany({ where: { Pid: productId } })

      const createdOptions = []
      for (const optName of data.options) {
        const newOpt = await tx.productOption.create({
          data: { name: optName, Pid: productId }
        })
        createdOptions.push(newOpt)
      }

      const optionValueCache = new Map<string, number>()

      const incomingVariantIds = data.variants
        .map((v: any) => v.id)
        .filter((id: any) => id && !String(id).startsWith('new-'))

      await tx.productVariant.deleteMany({
        where: {
          Pid: productId,
          ...(incomingVariantIds.length > 0 ? { id: { notIn: incomingVariantIds } } : {})
        }
      })

      for (const v of data.variants) {
        let currentVariantId = v.id;

        if (!currentVariantId || String(currentVariantId).startsWith('new-')) {
          const newVar = await tx.productVariant.create({
            data: { Pid: productId, price: Number(v.price) }
          })
          currentVariantId = newVar.id
        } else {
          await tx.productVariant.update({
            where: { id: currentVariantId },
            data: { price: Number(v.price) }
          })
        }

        for (let i = 0; i < data.options.length; i++) {
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
      maxWait: 5000,
      timeout: 15000
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("UPDATE ERROR:", error)
    return NextResponse.json({ message: "อัปเดตไม่สำเร็จ", error: String(error) }, { status: 500 })
  }
}