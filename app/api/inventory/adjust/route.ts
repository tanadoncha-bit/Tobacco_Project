import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const profileId = session?.user?.id

        const defaultNote = {
            OFFLINE_SALE: "เบิกขายหน้าร้าน",
            DAMAGED: "ตัดของชำรุด/เสียหาย",
            EXPIRED: "ตัดของหมดอายุ",
        }

        if (!profileId) {
            return NextResponse.json({ error: "Unauthorized - กรุณาเข้าสู่ระบบ" }, { status: 401 })
        }

        const { lotId, amount, reason, note } = await req.json()

        if (!lotId || !amount || Number(amount) <= 0) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน หรือจำนวนไม่ถูกต้อง" }, { status: 400 })
        }

        const deductAmount = Number(amount)
        const base = defaultNote[reason as keyof typeof defaultNote] || "ตัดสต๊อก"

        await prisma.$transaction(async (tx) => {
            const lot = await tx.productVariantLot.findUnique({
                where: { id: lotId },
                include: { variant: true }
            })

            if (!lot || lot.stock < deductAmount) {
                throw new Error("ยอดคงเหลือใน Lot นี้ไม่เพียงพอให้ตัดสต๊อก")
            }

            // หัก Lot
            await tx.productVariantLot.update({
                where: { id: lotId },
                data: { stock: { decrement: deductAmount } }
            })

            // log
            await tx.stockTransaction.create({
                data: {
                    variantId: lot.variantId,
                    variantLotId: lotId,
                    type: "OUT",
                    amount: deductAmount,
                    reason: reason || "EXPIRED",
                    note: note ? `${base} เนื่องจาก ${note}` : base,
                    profileId
                }
            })
        }, { timeout: 10000 })

        return NextResponse.json({ success: true, message: "ตัดสต๊อกเรียบร้อยแล้ว" })

    } catch (error: any) {
        console.error("ADJUST_STOCK_ERROR:", error)
        return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการปรับสต๊อก" }, { status: 500 })
    }
}