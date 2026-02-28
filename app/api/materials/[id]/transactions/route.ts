import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const materialId = Number(resolvedParams.id)

    const transactions = await prisma.materialTransaction.findMany({
      where: { materialId: materialId },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(transactions, { status: 200 })
  } catch (error) {
    console.error("GET TRANSACTIONS ERROR:", error)
    return NextResponse.json({ message: "ดึงข้อมูลประวัติไม่สำเร็จ" }, { status: 500 })
  }
}