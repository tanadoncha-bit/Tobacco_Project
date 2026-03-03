// ไฟล์: app/api/productions/route.ts
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

    // ดึงสูตรการผลิต (Recipe) ของ variant นี้
    const recipes = await prisma.productRecipe.findMany({
      where: { variantId: Number(variantId) },
      include: { material: true }
    })

    if (recipes.length === 0) {
      return NextResponse.json({ error: "ไม่พบสูตรการผลิตของสินค้านี้ กรุณาตั้งค่าสูตรก่อน" }, { status: 400 })
    }

    // ตรวจสอบว่าวัตถุดิบแต่ละตัวมีเพียงพอไหม
    for (const recipe of recipes) {
      const required = recipe.quantity * finalAmount
      if (recipe.material.stock < required) {
        return NextResponse.json({
          error: `วัตถุดิบ "${recipe.material.name}" ไม่เพียงพอ (ต้องการ ${required} ${recipe.material.unit}, คงเหลือ ${recipe.material.stock} ${recipe.material.unit})`
        }, { status: 400 })
      }
    }

    // สร้างเลขที่เอกสาร
    const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const lastOrder = await prisma.productionOrder.findFirst({
      where: { docNo: { startsWith: `PD-${datePrefix}` } },
      orderBy: { id: 'desc' }
    })
    let runningNumber = 1
    if (lastOrder) {
      const lastRunningStr = lastOrder.docNo.split('-')[2]
      runningNumber = parseInt(lastRunningStr) + 1
    }
    const newDocNo = `PD-${datePrefix}-${runningNumber.toString().padStart(3, '0')}`

    const result = await prisma.$transaction(async (tx) => {
      // 1. สร้างบิลสั่งผลิต
      const newOrder = await tx.productionOrder.create({
        data: {
          docNo: newDocNo,
          variantId: Number(variantId),
          amount: finalAmount,
          note: note,
          status: "PENDING"
        }
      })

      // 2. วนลูปตัดวัตถุดิบแต่ละรายการในสูตร
      for (const recipe of recipes) {
        let remaining = recipe.quantity * finalAmount // จำนวนที่ต้องตัดทั้งหมด

        // ดึง Lot ของวัตถุดิบนี้แบบ FIFO (lot ที่รับเข้าก่อน ตัดก่อน)
        const lots = await tx.materialLot.findMany({
          where: {
            materialId: recipe.materialId,
            stock: { gt: 0 }
          },
          orderBy: { receiveDate: 'asc' } // FIFO
        })

        for (const lot of lots) {
          if (remaining <= 0) break

          const deduct = Math.min(lot.stock, remaining)
          const lotCost = deduct * (lot.costPerUnit ?? 0)

          // หัก stock ใน lot
          await tx.materialLot.update({
            where: { id: lot.id },
            data: { stock: { decrement: deduct } }
          })

          // บันทึก MaterialTransaction พร้อม totalCost (สำคัญมาก! ใช้คำนวณต้นทุนสินค้า)
          await tx.materialTransaction.create({
            data: {
              materialId: recipe.materialId,
              materialLotId: lot.id,
              type: "OUT",
              amount: deduct,
              totalCost: lotCost, // ← ตรงนี้แหละที่ทำให้ต้นทุนสินค้าคำนวณได้
              note: `เบิกผลิต ${newDocNo}`,
              profileId,
              productionOrderId: newOrder.id
            }
          })

          remaining -= deduct
        }

        // อัปเดต stock รวมของวัตถุดิบ
        await tx.material.update({
          where: { id: recipe.materialId },
          data: { stock: { decrement: recipe.quantity * finalAmount } }
        })
      }

      return newOrder
    })

    return NextResponse.json({
      message: "สั่งผลิตสำเร็จ",
      docNo: result.docNo
    })

  } catch (error: any) {
    console.error("Create Production Error:", error)
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการสั่งผลิต" }, { status: 500 })
  }
}