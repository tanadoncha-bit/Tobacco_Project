import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const profileId = session?.user?.id

        const body = await req.json()
        const { docNo, note } = body

        if (!docNo) {
            return NextResponse.json({ error: "กรุณาระบุบิลสั่งผลิตที่ต้องการรับเข้า" }, { status: 400 })
        }

        const order = await prisma.productionOrder.findFirst({
            where: { docNo },
            include: { variant: { include: { product: true } } }
        })

        if (!order) {
            return NextResponse.json({ error: "ไม่พบข้อมูลบิลสั่งผลิตนี้ในระบบ" }, { status: 404 })
        }

        if (order.status !== "PENDING") {
            return NextResponse.json({ error: "บิลสั่งผลิตนี้ถูกรับเข้าหรือยกเลิกไปแล้ว" }, { status: 400 })
        }

        await prisma.$transaction(async (tx) => {
            await tx.productionOrder.update({
                where: { id: order.id },
                data: { status: "COMPLETED" }
            })

            await tx.productVariant.update({
                where: { id: order.variantId },
                data: { stock: { increment: order.amount } }
            })

            await tx.stockTransaction.create({
                data: {
                    variantId: order.variantId,
                    type: "IN",
                    amount: order.amount,
                    reason: "PRODUCTION",
                    note: `รับเข้าจากบิลผลิตเอกสาร: ${order.docNo} ${note}`,
                    reference: order.docNo,
                    profileId: profileId
                }
            })
        })

        return NextResponse.json({
            message: "รับเข้าสต๊อกสินค้าเรียบร้อยแล้ว",
            docNo: order.docNo
        })

    } catch (error: any) {
        console.error("Receive Production Error:", error)
        return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการรับเข้าสต๊อก" }, { status: 500 })
    }
}