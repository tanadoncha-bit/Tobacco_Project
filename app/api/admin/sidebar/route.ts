import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const STOCK_THRESHOLD = 5

export async function GET() {
  const now = new Date()

  const [settings, pendingOrders, nearExpiry, pendingProductions, products, expiredProducts, expiredMaterials] = await Promise.all([
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

    prisma.productionOrder.count({ where: { status: "PENDING" } }),

    prisma.product.findMany({
      include: {
        variants: {
          include: { productVariantLots: true }
        }
      }
    }),

    prisma.productVariantLot.count({
      where: { stock: { gt: 0 }, expireDate: { not: null, lte: now } },
    }),

    prisma.materialLot.count({
      where: { stock: { gt: 0 }, expireDate: { not: null, lte: now } },
    }),
  ])

  const productStocks = products.map(product =>
    product.variants.reduce((sum, v) =>
      sum + v.productVariantLots
        .filter(lot => !lot.expireDate || lot.expireDate > now)
        .reduce((s, lot) => s + lot.stock, 0)
    , 0)
  )

  const lowStock = productStocks.filter(stock => stock <= STOCK_THRESHOLD).length
  const openDefects = expiredProducts + expiredMaterials

  return NextResponse.json({
    storeName: settings?.storeName ?? "Tobacco",
    pendingOrders,
    nearExpiry,
    lowStock,
    pendingProductions,
    openDefects,
  })
}