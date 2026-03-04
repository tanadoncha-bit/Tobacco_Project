import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export const dynamic = "force-dynamic"

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 🌟 2. ใช้ await เพื่อแกะค่า id ออกมาจาก params
        const { id } = await params;
        const variantId = Number(id);

        if (!variantId) {
            return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
        }

        const lots = await prisma.productVariantLot.findMany({
            where: {
                variant: { Pid: Number(id) }
            },
            include: {
                variant: {
                    include: {
                        values: { include: { optionValue: true } }
                    }
                }
            },
            orderBy: [
                { expireDate: "asc" },
                { stock: "desc" },
            ]
        })

        return NextResponse.json(lots);

    } catch (error: any) {
        console.error("Fetch Product Lots Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch lots", message: error.message },
            { status: 500 }
        );
    }
}