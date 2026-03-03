import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const [pendingOrders, nearExpiry] = await Promise.all([
    prisma.order.count({
      where: { status: { in: ["PENDING", "VERIFYING"] } },
    }),
    prisma.materialLot.count({
      where: {
        stock: { gt: 0 },
        expireDate: {
          not: null,
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return NextResponse.json({ pendingOrders, nearExpiry })
}