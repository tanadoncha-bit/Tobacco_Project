import prisma from "@/utils/db"
import DashboardClient from "@/components/admin/DashboardClient"
import { ChartColumnIncreasing } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const [orders, lowStockVariants, topProducts, recentOrders, nearExpiryMaterials] =
    await Promise.all([
      prisma.order.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { totalAmount: true, createdAt: true, status: true },
      }),
      prisma.productVariant.findMany({
        where: { stock: { lt: 10 } },
        include: {
          product: { select: { Pname: true } },
          values: { include: { optionValue: true } },
        },
        take: 5,
      }),
      prisma.orderItem.groupBy({
        by: ["variantId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          profile: { select: { firstname: true, lastname: true } },
        },
      }),
      prisma.materialLot.findMany({
        where: {
          stock: { gt: 0 },
          expireDate: {
            not: null,
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: { material: { select: { name: true, unit: true } } },
        orderBy: { expireDate: "asc" },
        take: 5,
      }),
    ])

  const totalRevenue  = orders.reduce((s, o) => s + o.totalAmount, 0)
  const totalOrders   = orders.length
  const pendingOrders = orders.filter(o => o.status === "PENDING" || o.status === "VERIFYING").length

  const lowStockItems = lowStockVariants.map(v => ({
    id:      v.id,
    name:    v.product.Pname,
    variant: v.values.map(val => val.optionValue.value).join(", "),
    stock:   v.stock,
  }))

  const topProductIds = topProducts.map(t => t.variantId)
  const topVariants   = await prisma.productVariant.findMany({
    where: { id: { in: topProductIds } },
    include: {
      product: {
        select: {
          Pname: true,
          images: { select: { url: true }, take: 1 },
        },
      },
      values: { include: { optionValue: true } },
    },
  })
  const topProductItems = topProducts.map((t, i) => {
    const v = topVariants.find(v => v.id === t.variantId)
    return {
      rank:     i + 1,
      name:     v?.product.Pname ?? "—",
      variant:  v?.values.map(val => val.optionValue.value).join(", ") ?? "",
      image:    v?.product.images?.[0]?.url ?? null,
      quantity: t._sum.quantity ?? 0,
    }
  })

  const recentOrderItems = recentOrders.map(o => ({
    id:           o.id,
    totalAmount:  o.totalAmount,
    status:       o.status,
    createdAt:    o.createdAt.toISOString(),
    customerName: `${o.profile.firstname} ${o.profile.lastname}`,
  }))

  const nearExpiryItems = nearExpiryMaterials.map(lot => ({
    id:           lot.id,
    materialName: lot.material.name,
    unit:         lot.material.unit,
    lotNumber:    lot.lotNumber,
    stock:        lot.stock,
    expireDate:   lot.expireDate!.toISOString(),
  }))

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().split("T")[0]
  }).reverse()

  const salesData = last7Days.map(dateStr => {
    const daily = orders.filter(o => o.createdAt.toISOString().split("T")[0] === dateStr)
    const d = new Date(dateStr)
    return {
      date:    `${d.getDate()} ${d.toLocaleString("th-TH", { month: "short" })}`,
      ยอดขาย: daily.reduce((s, o) => s + o.totalAmount, 0),
    }
  })

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
            <ChartColumnIncreasing className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
            <p className="text-[16px] text-gray-500 font-medium mt-1">ภาพรวมรายได้ คำสั่งซื้อ และสถานะสต็อกของร้านค้า</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-3 text-sm font-medium text-gray-600 shrink-0">
          {today}
        </div>
      </div>

      <DashboardClient
        stats={{ totalRevenue, totalOrders, pendingOrders }}
        salesData={salesData}
        lowStockItems={lowStockItems}
        topProducts={topProductItems}
        recentOrders={recentOrderItems}
        nearExpiryMaterials={nearExpiryItems}
      />
    </div>
  )
}