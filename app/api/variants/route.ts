export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const variants = await prisma.productVariant.findMany({
      include: { 
        product: true,
        values: {
          include: {
            optionValue: {
              include: {
                option: true
              }
            }
          }
        }
      },
      orderBy: { id: 'desc' }
    })
    return NextResponse.json(variants)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 })
  }
}