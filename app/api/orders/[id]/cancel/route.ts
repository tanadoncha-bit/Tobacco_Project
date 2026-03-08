import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { returnStockByOrderItem } from "@/utils/inventory"

export const dynamic = "force-dynamic";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await params;
        const orderId = resolvedParams.id;

        if (!orderId) {
            return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 })
        }

        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        })

        if (!existingOrder) {
            return NextResponse.json({ error: "ไม่พบออเดอร์นี้" }, { status: 404 })
        }

        if (existingOrder.profileId !== session.user.id) {
            return NextResponse.json({ error: "คุณไม่มีสิทธิ์ยกเลิกออเดอร์นี้" }, { status: 403 })
        }

        if (existingOrder.status !== "PENDING") {
            return NextResponse.json(
                { error: "ไม่สามารถยกเลิกออเดอร์นี้ได้ เนื่องจากมีการเปลี่ยนสถานะไปแล้ว" },
                { status: 400 }
            )
        }

        const shortOrderId = orderId.substring(0, 8).toUpperCase()

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { status: "CANCELLED" }
            })

            for (const item of existingOrder.items) {
                await returnStockByOrderItem(tx, {
                    orderItemId: item.id,
                    profileId: session.user.id,
                    note: `คืนสต๊อกจากการยกเลิกออเดอร์ ORD-${shortOrderId}`
                })
            }
        }, {
            maxWait: 10000,
            timeout: 30000,
        })

        return NextResponse.json({ message: "ยกเลิกออเดอร์สำเร็จ" })

    } catch (error) {
        console.error("Cancel Order Error:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิกออเดอร์" }, { status: 500 })
    }
}