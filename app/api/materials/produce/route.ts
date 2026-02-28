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

    await prisma.$transaction(async (tx) => {
      for (const recipe of variant.recipes) {
        const requiredAmount = recipe.quantity * Number(produceAmount)

        const material = await tx.material.findUnique({
          where: { id: recipe.materialId }
        })

        if (!material) {
          throw new Error("ไม่พบข้อมูลวัตถุดิบในระบบ")
        }

        if (material.stock < requiredAmount) {
          throw new Error(`วัตถุดิบ "${material.name}" ไม่เพียงพอ (ต้องการ ${requiredAmount} ${material.unit} แต่มีแค่ ${material.stock} ${material.unit})`)
        }
      }

      const today = new Date()
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
      const formattedRunning = String(runningNumber).padStart(3, '0')
      const newDocNo = `PD-${datePrefix}-${formattedRunning}`

      await tx.productionOrder.create({
        data: {
          docNo: newDocNo,
          variantId: Number(variantId),
          amount: Number(produceAmount),
          status: "PENDING",
          note: note || null
        }
      })

      for (const recipe of variant.recipes) {
        const requiredAmount = recipe.quantity * Number(produceAmount)

        await tx.material.update({
          where: { id: recipe.materialId },
          data: { stock: { decrement: requiredAmount } }
        })

        await tx.materialTransaction.create({
          data: {
            materialId: recipe.materialId,
            type: "OUT",
            amount: requiredAmount,
            note: `เบิกผลิตเอกสาร ${newDocNo} (${variant.product.Pname}) จำนวน ${produceAmount} ชิ้น ${note ? `(หมายเหตุ: ${note})` : ""}`,
            profileId: profileId
          }
        })
      }
    })

    const updatedMaterials = await prisma.material.findMany({
      orderBy: { id: 'desc' }
    })

    return NextResponse.json(updatedMaterials)

  } catch (error: any) {
    console.error("Produce Error:", error)
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการผลิต" }, { status: 500 })
  }
}