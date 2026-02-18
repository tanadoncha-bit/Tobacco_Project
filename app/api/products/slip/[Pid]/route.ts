import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  context: { params: Promise<{ Pid: string }> }
) {
  try {
    const { Pid } = await context.params

    const slips = await prisma.productSlip.findMany({
      where: { Pid: Number(Pid) },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(slips)
  } catch (error) {
    console.error("GET PRODUCT SLIP ERROR:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
