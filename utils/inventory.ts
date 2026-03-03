export async function deductStockFIFO(
    tx: any, // 🌟 รับ tx มาจากไฟล์ API
    {
        variantId,
        amountToDeduct,
        profileId,
        note = "ขายสินค้า"
    }: {
        variantId: number
        amountToDeduct: number
        profileId?: string
        note?: string
    }
) {
    const variant = await tx.productVariant.findUnique({ where: { id: variantId } })

    if (!variant || variant.stock < amountToDeduct) {
        throw new Error(`สต๊อกสินค้าไม่เพียงพอ (ต้องการ ${amountToDeduct}, มีอยู่ ${variant?.stock || 0})`)
    }

    // ดึง Lot เรียงจากเก่าไปใหม่ (FIFO)
    const now = new Date()
    const availableLots = await tx.productVariantLot.findMany({
        where: {
            variantId: variantId,
            stock: { gt: 0 },
            OR: [
                { expireDate: null }, // ไม่มีวันหมดอายุ
                { expireDate: { gt: now } } // หรือ วันหมดอายุต้องมากกว่าปัจจุบัน
            ]
        },
        orderBy: { produceDate: 'asc' }
    })

    let remainingToDeduct = amountToDeduct

    for (const lot of availableLots) {
        if (remainingToDeduct <= 0) break

        const deductFromThisLot = Math.min(lot.stock, remainingToDeduct)

        // หักสต๊อกใน Lot
        await tx.productVariantLot.update({
            where: { id: lot.id },
            data: { stock: { decrement: deductFromThisLot } }
        })

        // บันทึกประวัติ
        await tx.stockTransaction.create({
            data: {
                variantId: variantId,
                variantLotId: lot.id,
                type: "SALE_OUT",
                amount: deductFromThisLot,
                reason: "SALE",
                note: note,
                profileId: profileId
            }
        })

        remainingToDeduct -= deductFromThisLot
    }

    // หักสต๊อกรวม
    await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: amountToDeduct } }
    })
}

// 🌟 ฟังก์ชันสำหรับคืนสต๊อก (เวลากดยกเลิกออเดอร์)
export async function returnStockToLatestLot(
    tx: any,
    {
        variantId,
        amountToReturn,
        profileId,
        note = "คืนสต๊อก"
    }: {
        variantId: number
        amountToReturn: number
        profileId?: string
        note?: string
    }
) {
    // หา Lot ล่าสุดของสินค้านี้เพื่อเอาของไปคืน
    let targetLot = await tx.productVariantLot.findFirst({
        where: { variantId: variantId },
        orderBy: { produceDate: 'desc' }
    })

    // ถ้าไม่มี Lot เลย (เช่น ถูกลบไปแล้ว) ให้สร้าง Lot กลางขึ้นมารับของคืน
    if (!targetLot) {
        targetLot = await tx.productVariantLot.create({
            data: {
                variantId: variantId,
                lotNumber: `RETURN-${new Date().getTime()}`,
                stock: 0
            }
        })
    }

    // คืนสต๊อกเข้า Lot
    await tx.productVariantLot.update({
        where: { id: targetLot.id },
        data: { stock: { increment: amountToReturn } }
    })

    // คืนสต๊อกรวม
    await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: amountToReturn } }
    })

    // บันทึกประวัติ
    await tx.stockTransaction.create({
        data: {
            variantId: variantId,
            variantLotId: targetLot.id,
            type: "RESTOCK_IN",
            amount: amountToReturn,
            reason: "CANCELLED_ORDER",
            note: note,
            profileId: profileId
        }
    })
}