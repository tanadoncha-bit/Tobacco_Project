import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function DELETE(req: Request) {
  try {
    const { Pid } = await req.json()

    if (!Pid) {
      return NextResponse.json(
        { message: "Pid is required" },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { Pid },
      select: { Pid: true },
    })

    if (!product) {
      return NextResponse.json({ success: true })
    }

    await prisma.product.delete({
      where: { Pid },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
