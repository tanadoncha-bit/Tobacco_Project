// app/api/admin/sidebar/route.ts
import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const [settings, pendingOrders, nearExpiry] = await Promise.all([
    prisma.storeSetting.findFirst({ select: { storeName: true } }),
    prisma.order.count({ where: { status: { in: ["PENDING", "VERIFYING"] } } }),
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

  return NextResponse.json({
    storeName: settings?.storeName ?? "Tobacco",
    pendingOrders,
    nearExpiry,
  })
}