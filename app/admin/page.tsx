import prisma from "@/utils/db"
import DashboardClient from "@/components/admin/DashboardClient"
import { ChartColumnIncreasing } from "lucide-react"

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { totalAmount: true, createdAt: true, status: true },
  })

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0)
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length

  const lowStockVariants = await prisma.productVariant.findMany({
    where: { stock: { lt: 10 } },
    include: {
      product: { select: { Pname: true } },
      values: { include: { optionValue: true } },
    },
    take: 5,
  })

  const lowStockItems = lowStockVariants.map((v) => ({
    id: v.id,
    name: v.product.Pname,
    variant: v.values.map(val => val.optionValue.value).join(", "),
    stock: v.stock,
  }))

  const last7Days = Array.from({ length: 7 })
    .map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split("T")[0]
    })
    .reverse()

  const salesData = last7Days.map((dateStr) => {
    const dailyOrders = orders.filter(
      (o) => o.createdAt.toISOString().split("T")[0] === dateStr
    )

    const dateObj = new Date(dateStr)
    const displayDate = `${dateObj.getDate()} ${dateObj.toLocaleString('th-TH', { month: 'short' })}`

    return {
      date: displayDate,
      ยอดขาย: dailyOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    }
  })

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="p-8 space-y-8">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ChartColumnIncreasing  className="w-7 h-7 text-purple-600" />
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            ภาพรวมรายได้ คำสั่งซื้อ และสถานะสต๊อกของร้านค้า
          </p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-6 py-3 text-sm text-gray-600">
          {today}
        </div>
      </div>

      <DashboardClient
        stats={{ totalRevenue, totalOrders, pendingOrders }}
        salesData={salesData}
        lowStockItems={lowStockItems}
      />

    </div>
  )
}