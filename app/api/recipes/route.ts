export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ดึงข้อมูลสูตรตาม ID ของสินค้า (Variant)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const variantId = searchParams.get("variantId")

    if (!variantId) {
      return NextResponse.json({ error: "Missing variantId" }, { status: 400 })
    }

    const recipes = await prisma.productRecipe.findMany({
      where: { variantId: Number(variantId) },
      include: {
        material: true // ดึงชื่อและหน่วยของวัตถุดิบมาด้วย
      },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json(recipes)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 })
  }
}

// เพิ่มวัตถุดิบเข้าสูตร
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { variantId, materialId, quantity } = body

    if (!variantId || !materialId || !quantity) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    // สร้างสูตรใหม่
    const newRecipe = await prisma.productRecipe.create({
      data: {
        variantId: Number(variantId),
        materialId: Number(materialId),
        quantity: Number(quantity)
      },
      include: {
        material: true // ส่งข้อมูล material กลับไปให้ frontend อัปเดตตารางด้วย
      }
    })

    return NextResponse.json(newRecipe)
  } catch (error: any) {
    // ดักจับ Error กรณีใส่ Material ซ้ำใน Variant เดียวกัน (เพราะเราตั้ง @@unique ไว้ใน Prisma)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "วัตถุดิบนี้อยู่ในสูตรแล้ว" }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create recipe" }, { status: 500 })
  }
}