import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const material = await prisma.material.create({
      data: {
        code: data.code || null,
        name: data.name,
        unit: data.unit,
        costPerUnit: data.costPerUnit || 0,
      }
    })
    return NextResponse.json(material)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create material" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const materials = await prisma.material.findMany({
      orderBy: { name: "asc" },
      include: {
        MaterialLot: {
          orderBy: [{ expireDate: "asc" }, { receiveDate: "asc" }],
        },
      },
    })
    return NextResponse.json(materials)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 })
  }
}