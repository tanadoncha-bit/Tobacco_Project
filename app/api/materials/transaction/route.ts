import { authOptions } from "@/utils/authOptions"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // 🔥 ย้าย getServerSession มาไว้ข้างนอก Transaction เพื่อให้ DB ทำงานเร็วขึ้น
    const session = await getServerSession(authOptions)
    const profileId = session?.user?.id

    const { materialId, type, amount, totalCost, note } = await req.json()

    if (!materialId || !type || !amount || amount <= 0) {
      return NextResponse.json(
        { message: "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {

      const material = await tx.material.findUnique({
        where: { id: materialId },
      })

      if (!material) {
        throw new Error("ไม่พบข้อมูลวัตถุดิบนี้ในระบบ")
      }

      let newStock = material.stock
      let newAvgCost = material.costPerUnit ?? 0

      // =========================
      // 🔥 RECEIVE MATERIAL (IN)
      // =========================
      if (type === "IN") {

        if (!totalCost || totalCost <= 0) {
          throw new Error("กรุณาระบุต้นทุนรวม (totalCost)")
        }

        const oldStock = material.stock
        const oldAvg = material.costPerUnit ?? 0

        const oldTotalValue = oldStock * oldAvg
        const newTotalValue = oldTotalValue + totalCost

        newStock = oldStock + amount
        newAvgCost = newTotalValue / newStock
      }

      // =========================
      // 🔥 ISSUE MATERIAL (OUT)
      // =========================
      if (type === "OUT") {

        if (material.stock < amount) {
          throw new Error("จำนวนสต๊อกคงเหลือไม่เพียงพอให้เบิกออก")
        }

        newStock = material.stock - amount
        // ❗ Average cost ไม่เปลี่ยนตอน OUT
      }

      // 1️⃣ อัปเดต Material
      const updatedMaterial = await tx.material.update({
        where: { id: materialId },
        data: {
          stock: newStock,
          costPerUnit: newAvgCost,
        },
      })

      // 2️⃣ บันทึก Transaction
      const transaction = await tx.materialTransaction.create({
        data: {
          materialId,
          type,
          amount,
          totalCost: type === "IN" ? totalCost : null,
          note,
          // 🚨 เปลี่ยนจาก createdBy เป็น profileId ตาม Schema ใหม่
          profileId: profileId, 
        },
      })

      return { updatedMaterial, transaction }
    })

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error("MATERIAL TRANSACTION ERROR:", error)
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}