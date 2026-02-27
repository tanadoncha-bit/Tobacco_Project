import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ลบวัตถุดิบออกจากสูตร
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 1. เปลี่ยน Type ตรงนี้ให้เป็น Promise
) {
  try {
    const { id } = await params // 👈 2. ใส่ await ก่อนดึง id ออกมาใช้
    const recipeId = Number(id)

    await prisma.productRecipe.delete({
      where: { id: recipeId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete recipe" }, { status: 500 })
  }
}