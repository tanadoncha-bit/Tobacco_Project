export async function deductStockFIFO(
    tx: any,
    {
        variantId,
        amountToDeduct,
        orderItemId,
        profileId,
        note = "ขายสินค้า"
    }: {
        variantId: number
        amountToDeduct: number
        orderItemId?: number  // ส่งมาเพื่อ track OrderItemLot
        profileId?: string
        note?: string
    }
) {
    const now = new Date()

    const availableLots = await tx.productVariantLot.findMany({
        where: {
            variantId,
            stock: { gt: 0 },
            OR: [
                { expireDate: null },
                { expireDate: { gt: now } }
            ]
        },
        orderBy: [
            { expireDate: 'asc' },
            { produceDate: 'asc' } 
        ]
    })

    const totalStock = availableLots.reduce((sum: number, lot: any) => sum + lot.stock, 0)
    if (totalStock < amountToDeduct) {
        throw new Error(`สต๊อกสินค้าไม่เพียงพอ (ต้องการ ${amountToDeduct}, มีอยู่ ${totalStock})`)
    }

    let remainingToDeduct = amountToDeduct

    for (const lot of availableLots) {
        if (remainingToDeduct <= 0) break

        const deductFromThisLot = Math.min(lot.stock, remainingToDeduct)

        // หักสต๊อกใน Lot
        await tx.productVariantLot.update({
            where: { id: lot.id },
            data: { stock: { decrement: deductFromThisLot } }
        })

        // บันทึก OrderItemLot ว่าหักจาก lot นี้ไปเท่าไหร่
        if (orderItemId) {
            await tx.orderItemLot.create({
                data: {
                    orderItemId,
                    lotId: lot.id,
                    quantity: deductFromThisLot
                }
            })
        }

        // บันทึกประวัติ
        await tx.stockTransaction.create({
            data: {
                variantId,
                variantLotId: lot.id,
                type: "OUT",
                amount: deductFromThisLot,
                reason: "SALE",
                note,
                profileId
            }
        })

        remainingToDeduct -= deductFromThisLot
    }
}

// คืนสต๊อกกลับไป lot เดิมที่หักออกมา (ดูจาก OrderItemLot)
export async function returnStockByOrderItem(
    tx: any,
    {
        orderItemId,
        profileId,
        note = "คืนสต๊อก"
    }: {
        orderItemId: number
        profileId?: string
        note?: string
    }
) {

    // ดึงว่า order item นี้หักจาก lot ไหนไปเท่าไหร่
    const lotDeductions = await tx.orderItemLot.findMany({
        where: { orderItemId },
        include: { lot: true }
    })

    if (lotDeductions.length === 0) {
        // fallback: ถ้าไม่มี record (order เก่าก่อน migrate) ใช้วิธีเดิม
        const orderItem = await tx.orderItem.findUnique({ where: { id: orderItemId } })
        if (!orderItem) return

        let targetLot = await tx.productVariantLot.findFirst({
            where: { variantId: orderItem.variantId },
            orderBy: { produceDate: 'desc' }
        })
        if (!targetLot) {
            const anyLot = await tx.productVariantLot.findFirst({
                where: { variantId: orderItem.variantId },
                orderBy: { unitCost: 'desc' }
            })

            targetLot = await tx.productVariantLot.create({
                data: {
                    variantId: orderItem.variantId,
                    lotNumber: `RETURN-${Date.now()}`,
                    stock: 0,
                    unitCost: anyLot?.unitCost || 0
                }
            })
        }

        await tx.productVariantLot.update({
            where: { id: targetLot.id },
            data: { stock: { increment: orderItem.quantity } }
        })

        await tx.stockTransaction.create({
            data: {
                variantId: orderItem.variantId,
                variantLotId: targetLot.id,
                type: "IN",
                amount: orderItem.quantity,
                reason: "RETURN",
                note,
                profileId
            }
        })
        return
    }

    // คืนกลับ lot เดิมทุก lot ที่เคยหักออกไป
    for (const deduction of lotDeductions) {
        await tx.productVariantLot.update({
            where: { id: deduction.lotId },
            data: { stock: { increment: deduction.quantity } }
        })

        await tx.stockTransaction.create({
            data: {
                variantId: deduction.lot.variantId,
                variantLotId: deduction.lotId,
                type: "IN",
                amount: deduction.quantity,
                reason: "RETURN",
                note,
                profileId
            }
        })
    }
}