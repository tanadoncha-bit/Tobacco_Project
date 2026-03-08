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

        // ดึง StockTransaction (สินค้า)
        const defectLogs = await prisma.stockTransaction.findMany({
            where: { type: "OUT", reason: { in: ["EXPIRED", "DAMAGED"] } },
            include: {
                variant: { include: { product: true } },
                variantLot: true,
            },
            orderBy: { createdAt: "desc" }
        })

        // ดึง MaterialTransaction (วัตถุดิบ) ที่ note มี keyword หมดอายุ/ตัด
        const materialLogs = await prisma.materialTransaction.findMany({
            where: {
                type: "OUT",
                reason: "ADJUSTMENT",
                note: { contains: "หมดอายุ" }
            },
            include: {
                material: true,
                materialLot: true,
            },
            orderBy: { createdAt: "desc" }
        })

        const formattedProducts = defectLogs.map(item => ({
            id: `PROD-${item.id}`,
            type: "PRODUCT",
            name: item.variant?.product?.Pname || "ไม่ทราบชื่อสินค้า",
            lotNumber: item.variantLot?.lotNumber || "-",
            amount: item.amount,
            unit: "ชิ้น",
            unitCost: item.variantLot?.unitCost || 0,
            createdAt: item.createdAt,
            reason: item.reason
        }))

        const formattedMaterials = materialLogs.map(item => ({
            id: `MAT-${item.id}`,
            type: "MATERIAL",
            name: item.material?.name || "ไม่ทราบชื่อวัตถุดิบ",
            lotNumber: item.materialLot?.lotNumber || "-",
            amount: item.amount,
            unit: item.material?.unit || "หน่วย",
            unitCost: item.materialLot?.costPerUnit || 0,
            createdAt: item.createdAt,
            reason: "EXPIRED"
        }))

        const combined = [...formattedProducts, ...formattedMaterials]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return NextResponse.json({ success: true, data: combined })

    } catch (error: any) {
        console.error("FETCH_DEFECTS_REPORT_ERROR:", error)
        return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรายงานได้" }, { status: 500 })
    }
}