import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const profileId = session?.user?.id

    if (!profileId) {
      return NextResponse.json({ error: "Unauthorized - กรุณาเข้าสู่ระบบ" }, { status: 401 })
    }

    const body = await req.json()
    const { variantId, amount, note } = body

    if (!variantId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    const finalAmount = Number(amount)

    const recipes = await prisma.productRecipe.findMany({
      where: { variantId: Number(variantId) },
      include: { material: { include: { MaterialLot: { where: { stock: { gt: 0 } } } } } }
    })

    if (recipes.length === 0) {
      return NextResponse.json({ error: "ไม่พบสูตรการผลิตของสินค้านี้ กรุณาตั้งค่าสูตรก่อน" }, { status: 400 })
    }

    // validate stock จาก lot
    for (const recipe of recipes) {
      const required = recipe.quantity * finalAmount
      const totalLotStock = recipe.material.MaterialLot.reduce((sum, lot) => sum + lot.stock, 0)
      if (totalLotStock < required) {
        return NextResponse.json({
          error: `วัตถุดิบ "${recipe.material.name}" ไม่เพียงพอ (ต้องการ ${required} ${recipe.material.unit}, คงเหลือ ${totalLotStock} ${recipe.material.unit})`
        }, { status: 400 })
      }
    }

    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, "")
    const lastOrder = await prisma.productionOrder.findFirst({
      where: { docNo: { startsWith: `PD-${datePrefix}` } },
      orderBy: { id: "desc" }
    })
    let runningNumber = 1
    if (lastOrder) {
      const lastRunningStr = lastOrder.docNo.split("-")[2]
      runningNumber = parseInt(lastRunningStr) + 1
    }
    const newDocNo = `PD-${datePrefix}-${runningNumber.toString().padStart(3, "0")}`

    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.productionOrder.create({
        data: { docNo: newDocNo, variantId: Number(variantId), amount: finalAmount, note, status: "PENDING" }
      })

      for (const recipe of recipes) {
        let remaining = recipe.quantity * finalAmount

        const lots = await tx.materialLot.findMany({
          where: { materialId: recipe.materialId, stock: { gt: 0 } },
          orderBy: { receiveDate: "asc" }
        })

        for (const lot of lots) {
          if (remaining <= 0) break
          const deduct = Math.min(lot.stock, remaining)

          await tx.materialLot.update({
            where: { id: lot.id },
            data: { stock: { decrement: deduct } }
          })

          await tx.materialTransaction.create({
            data: {
              materialId: recipe.materialId,
              materialLotId: lot.id,
              type: "OUT",
              reason: "PRODUCTION_USE",
              amount: deduct,
              totalCost: deduct * (lot.costPerUnit ?? 0),
              note: `เบิกผลิต ${newDocNo}`,
              profileId,
              productionOrderId: newOrder.id
            }
          })

          remaining -= deduct
        }
        // ไม่ update material.stock แล้ว — คำนวณจาก lot แทน
      }

      return newOrder
    })

    return NextResponse.json({ message: "สั่งผลิตสำเร็จ", docNo: result.docNo })

  } catch (error: any) {
    console.error("Create Production Error:", error)
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการสั่งผลิต" }, { status: 500 })
  }
}