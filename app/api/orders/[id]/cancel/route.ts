import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        // 1. เช็คว่าล็อกอินหรือยัง
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const resolvedParams = await params;
        const orderId = resolvedParams.id;

        // ดักไว้หน่อยเผื่อ id พัง
        if (!orderId) {
            return NextResponse.json({ error: "Invalid Order ID" }, { status: 400 })
        }

        // 2. ค้นหาออเดอร์เพื่อเช็คสิทธิ์และสถานะ
        const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        })

        if (!existingOrder) {
            return NextResponse.json({ error: "ไม่พบออเดอร์นี้" }, { status: 404 })
        }

        // 3. เช็คว่าเป็นออเดอร์ของ user คนนี้จริงๆ ใช่ไหม
        if (existingOrder.profileId !== session.user.id) {
            return NextResponse.json({ error: "คุณไม่มีสิทธิ์ยกเลิกออเดอร์นี้" }, { status: 403 })
        }

        // 4. เช็คสถานะว่าอนุญาตให้ยกเลิกไหม (ต้องเป็น PENDING เท่านั้น)
        if (existingOrder.status !== "PENDING") {
            return NextResponse.json(
                { error: "ไม่สามารถยกเลิกออเดอร์นี้ได้ เนื่องจากมีการเปลี่ยนสถานะไปแล้ว" },
                { status: 400 }
            )
        }

        const shortOrderId = orderId.substring(0, 8).toUpperCase()
        // 5. ใช้ Prisma Transaction เพื่ออัปเดตสถานะออเดอร์ + คืนสต๊อกสินค้า (ถ้าตอนสั่งมีการตัดสต๊อกไปแล้ว)
        await prisma.$transaction(async (tx) => {
            // 5.1 เปลี่ยนสถานะเป็น CANCELLED
            await tx.order.update({
                where: { id: orderId },
                data: { status: "CANCELLED" }
            })

            // 5.2 คืนสต๊อกให้สินค้าแต่ละรายการ และบันทึกประวัติ StockTransaction
            for (const item of existingOrder.items) {
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: {
                        stock: { increment: item.quantity } // คืนจำนวนกลับเข้าไป
                    }
                })

                // บันทึกประวัติการรับเข้า (คืนของจากการยกเลิก)
                await tx.stockTransaction.create({
                    data: {
                        variantId: item.variantId,
                        type: "IN",
                        amount: item.quantity,
                        note: `คืนสต๊อกจากการยกเลิกออเดอร์ ORD-${shortOrderId}`,
                        profileId: session.user.id
                    }
                })
            }
        })

        return NextResponse.json({ message: "ยกเลิกออเดอร์สำเร็จ" })

    } catch (error) {
        console.error("Cancel Order Error:", error)
        return NextResponse.json({ error: "เกิดข้อผิดพลาดในการยกเลิกออเดอร์" }, { status: 500 })
    }
}