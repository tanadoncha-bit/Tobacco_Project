import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const defectLogs = await prisma.stockTransaction.findMany({
            where: {
                type: "ADJUST_OUT",
                reason: "EXPIRED"
            },
            include: {
                variant: {
                    include: {
                        product: true
                    }
                },
                variantLot: true,
                profile: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        const formatted = defectLogs.map(item => ({
            id: item.id,
            type: "HISTORY",
            name: item.variant?.product?.Pname || "ไม่ทราบชื่อสินค้า",
            lotNumber: item.variantLot?.lotNumber || "-",
            amount: item.amount,
            unitCost: item.variantLot?.unitCost || 0,
            createdAt: item.createdAt,
            reason: item.reason
        }))

        return NextResponse.json({ success: true, data: formatted })

    } catch (error: any) {
        console.error("FETCH_DEFECTS_REPORT_ERROR:", error)
        return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรายงานได้" }, { status: 500 })
    }
}