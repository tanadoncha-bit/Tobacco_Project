import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ Pid: string }> }) {
  try {
    const resolvedParams = await params
    const productId = Number(resolvedParams.Pid)

    const slips = await prisma.productSlip.findMany({
      where: { Pid: productId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(slips, { status: 200 })
  } catch (error) {
    console.error("GET PRODUCT SLIP ERROR:", error)
    return NextResponse.json({ message: "ดึงข้อมูลประวัติไม่สำเร็จ" }, { status: 500 })
  }
}