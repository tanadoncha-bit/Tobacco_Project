import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ Pid: string }> }) {
  try {
    const resolvedParams = await params
    const productId = Number(resolvedParams.Pid)

    const transactions = await prisma.stockTransaction.findMany({
      where: { 
        variant: { Pid: productId } 
      },
      include: {
        profile: true,
        variant: {
          include: {
            values: { include: { optionValue: true } } 
          }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(transactions, { status: 200 })
  } catch (error) {
    console.error("GET STOCK TRANSACTIONS ERROR:", error)
    return NextResponse.json({ message: "ดึงข้อมูลประวัติสต๊อกไม่สำเร็จ" }, { status: 500 })
  }
}