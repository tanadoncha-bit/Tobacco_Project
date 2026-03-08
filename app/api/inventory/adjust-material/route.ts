import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const profileId = session?.user?.id
        if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { lotId, amount, reason, note } = await req.json()
        if (!lotId || !amount || Number(amount) <= 0)
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })

        const deductAmount = Number(amount)

        await prisma.$transaction(async (tx) => {
            const lot = await tx.materialLot.findUnique({
                where: { id: lotId }
            })

            if (!lot || lot.stock < deductAmount)
                throw new Error("ยอดคงเหลือใน Lot นี้ไม่เพียงพอ")

            await tx.materialLot.update({
                where: { id: lotId },
                data: { stock: { decrement: deductAmount } }
            })

            await tx.materialTransaction.create({
                data: {
                    materialId: lot.materialId,
                    materialLotId: lotId,
                    type: "OUT",
                    reason: "ADJUSTMENT",
                    amount: deductAmount,
                    note: note || (reason === "EXPIRED" ? "ตัดวัตถุดิบหมดอายุ" : "ตัดวัตถุดิบชำรุด"),
                    profileId,
                }
            })
        }, { timeout: 10000 })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}