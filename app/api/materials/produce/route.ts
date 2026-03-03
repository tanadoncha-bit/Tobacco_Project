import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const profileId = session?.user?.id 

    const body = await req.json()
    const { variantId, produceAmount, note } = body

    if (!variantId || !produceAmount || produceAmount <= 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง กรุณาระบุตัวเลือกสินค้า (Variant)" }, { status: 400 })
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: Number(variantId) },
      include: { recipes: true, product: true }
    })

    if (!variant) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสินค้าย่อย (Variant)" }, { status: 404 })
    }

    if (!variant.recipes || variant.recipes.length === 0) {
      return NextResponse.json({ error: "ไม่พบสูตรการผลิตสำหรับสินค้านี้ กรุณาตั้งค่าสูตรก่อน" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const today = new Date()

      // --- 1. ตรวจสอบสต๊อกล๊อตที่ยังไม่หมดอายุ (Validation) ---
      for (const recipe of variant.recipes) {
        const requiredAmount = recipe.quantity * Number(produceAmount)

        const availableLots = await tx.materialLot.findMany({
          where: { 
            materialId: recipe.materialId, 
            stock: { gt: 0 },
            OR: [
              { expireDate: { gt: today } }, 
              { expireDate: null }  
            ]
          }
        })

        const totalValidStock = availableLots.reduce((sum, l) => sum + l.stock, 0)

        if (totalValidStock < requiredAmount) {
          const mat = await tx.material.findUnique({ where: { id: recipe.materialId } })
          throw new Error(`วัตถุดิบ "${mat?.name}" ไม่เพียงพอ (ต้องการ ${requiredAmount} แต่มีล๊อตที่ใช้งานได้แค่ ${totalValidStock})`)
        }
      }
      
      const yy = today.getFullYear().toString().slice(2)
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      const datePrefix = `${yy}${mm}${dd}`

      const lastOrder = await tx.productionOrder.findFirst({
        where: { docNo: { startsWith: `PD-${datePrefix}` } },
        orderBy: { id: 'desc' }
      })

      let runningNumber = 1
      if (lastOrder) {
        const parts = lastOrder.docNo.split('-')
        if (parts.length === 3) {
          runningNumber = parseInt(parts[2], 10) + 1
        }
      }
      const newDocNo = `PD-${datePrefix}-${String(runningNumber).padStart(3, '0')}`

      const newOrder = await tx.productionOrder.create({
        data: {
          docNo: newDocNo,
          variantId: Number(variantId),
          amount: Number(produceAmount),
          status: "PENDING",
          note: note || null
        }
      })

      for (const recipe of variant.recipes) {
        const totalNeeded = recipe.quantity * Number(produceAmount)
        let remainingToDeduct = totalNeeded

        const lots = await tx.materialLot.findMany({
          where: { 
            materialId: recipe.materialId, 
            stock: { gt: 0 },
            OR: [
              { expireDate: { gt: today } },
              { expireDate: null }
            ]
          },
          orderBy: [
            { expireDate: 'asc' }, 
            { id: 'asc' } 
          ]
        })

        for (const lot of lots) {
          if (remainingToDeduct <= 0) break

          const deductAmount = Math.min(lot.stock, remainingToDeduct)
          
          await tx.materialLot.update({
            where: { id: lot.id },
            data: { stock: { decrement: deductAmount } }
          })

          await tx.materialTransaction.create({
            data: {
              materialId: recipe.materialId,
              materialLotId: lot.id,
              type: "PROD_OUT",
              amount: deductAmount,
              totalCost: deductAmount * (lot.costPerUnit ?? 0),
              note: `เบิกผลิต ${newDocNo} [Lot: ${lot.lotNumber}]`,
              profileId: profileId,
              productionOrderId: newOrder.id 
            }
          })

          remainingToDeduct -= deductAmount
        }

        await tx.material.update({
          where: { id: recipe.materialId },
          data: { stock: { decrement: totalNeeded } }
        })
      }

      return { newDocNo }
    })

    const updatedMaterials = await prisma.material.findMany({
      orderBy: { id: 'desc' }
    })

    return NextResponse.json(updatedMaterials)

  } catch (error: any) {
    console.error("Produce Error:", error)
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการผลิต" }, 
      { status: error.message?.includes("ไม่เพียงพอ") ? 400 : 500 }
    )
  }
}