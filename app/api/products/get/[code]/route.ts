import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  try {
    // 🔥 ต้อง await params ก่อน
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
                optionValue: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
