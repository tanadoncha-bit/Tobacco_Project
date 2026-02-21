import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params

    const product = await prisma.product.findUnique({
      where: { productCode: code },
      include: {
        images: true,
        Option: {
          include: {
            values: true,
          },
        },
        variants: {
          include: {
            values: {
              include: {
                optionValue: {
                  include: {
                    option: true, // ⭐ สำคัญ
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: "Error" }, { status: 500 })
  }
}
