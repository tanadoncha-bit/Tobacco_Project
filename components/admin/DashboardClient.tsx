"use client"

import { DollarSign, ShoppingBag, Clock, AlertTriangle } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts"

type DashboardProps = {
  stats: {
    totalRevenue: number
    totalOrders: number
    pendingOrders: number
  }
  salesData: { date: string; ยอดขาย: number }[]
  lowStockItems: { id: number; name: string; variant: string; stock: number }[]
}

export default function DashboardClient({ stats, salesData, lowStockItems }: DashboardProps) {
  return (
    <div className="space-y-8">

      {/* ================= STAT CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Revenue */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">
                ยอดขายรวมทั้งหมด
              </p>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                ฿ {stats.totalRevenue.toLocaleString()}
              </h3>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 text-white flex items-center justify-center shadow-md">
              <DollarSign className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">
                คำสั่งซื้อทั้งหมด
              </p>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.totalOrders.toLocaleString()}
              </h3>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white flex items-center justify-center shadow-md">
              <ShoppingBag className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">
                รอชำระ / รอดำเนินการ
              </p>
              <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                {stats.pendingOrders.toLocaleString()}
              </h3>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-md">
              <Clock className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* SALES CHART */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-8 shadow-md border border-gray-100">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                ยอดขาย 7 วันย้อนหลัง
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                แสดงแนวโน้มรายได้ย้อนหลังแบบรายวัน
              </p>
            </div>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `฿${value}`}
                  tick={{ fontSize: 12 }}
                />

                <Tooltip
                  formatter={(value: any) => [
                    `฿${Number(value || 0).toLocaleString()}`,
                    "ยอดขาย"
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow:
                      "0 10px 25px -5px rgba(0,0,0,0.08)"
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="ยอดขาย"
                  stroke="#7c3aed"
                  strokeWidth={3}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LOW STOCK */}
        <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              สินค้าใกล้หมด
            </h3>
          </div>

          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors duration-200"
                >
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {item.name}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.variant}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {item.stock}
                    </p>
                    <p className="text-[11px] text-red-400 uppercase font-semibold tracking-wide">
                      ชิ้น
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                ไม่มีสินค้าใกล้หมด
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}