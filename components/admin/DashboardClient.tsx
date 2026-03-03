"use client"

import { DollarSign, ShoppingBag, Clock, AlertTriangle, Trophy, FlaskConical, ExternalLink } from "lucide-react"
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts"
import Link from "next/link"

type DashboardProps = {
  stats: { totalRevenue: number; totalOrders: number; pendingOrders: number }
  salesData: { date: string; ยอดขาย: number }[]
  lowStockItems: { id: number; name: string; variant: string; stock: number }[]
  topProducts: { rank: number; name: string; variant: string; image: string | null; quantity: number }[]
  recentOrders: { id: string; totalAmount: number; status: string; createdAt: string; customerName: string }[]
  nearExpiryMaterials: { id: number; materialName: string; unit: string; lotNumber: string; stock: number; expireDate: string }[]
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-600 border-amber-200",
  VERIFYING: "bg-blue-50 text-blue-600 border-blue-200",
  PAID:      "bg-indigo-50 text-indigo-600 border-indigo-200",
  SHIPPED:   "bg-purple-50 text-purple-600 border-purple-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-600 border-rose-200",
}

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "รอดำเนินการ",
  VERIFYING: "รอยืนยัน",
  PAID:      "ชำระแล้ว",
  SHIPPED:   "จัดส่งแล้ว",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
}

const RANK_STYLE = [
  "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-amber-200",
  "bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-200",
  "bg-gradient-to-br from-orange-400 to-amber-600 shadow-orange-200",
  "bg-gray-100 text-gray-500",
  "bg-gray-100 text-gray-500",
]

export default function DashboardClient({
  stats, salesData, lowStockItems, topProducts, recentOrders, nearExpiryMaterials,
}: DashboardProps) {
  return (
    <div className="space-y-8">

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          {
            label:    "ยอดขายรวมทั้งหมด",
            value:    `฿${stats.totalRevenue.toLocaleString()}`,
            icon:     <DollarSign className="w-6 h-6" />,
            gradient: "from-emerald-400 to-teal-500",
            shadow:   "shadow-emerald-200",
          },
          {
            label:    "คำสั่งซื้อทั้งหมด",
            value:    stats.totalOrders.toLocaleString(),
            unit:     "ออเดอร์",
            icon:     <ShoppingBag className="w-6 h-6" />,
            gradient: "from-purple-500 to-violet-600",
            shadow:   "shadow-purple-200",
          },
          {
            label:    "รอชำระ / รอดำเนินการ",
            value:    stats.pendingOrders.toLocaleString(),
            unit:     "ออเดอร์",
            icon:     <Clock className="w-6 h-6" />,
            gradient: "from-amber-400 to-orange-500",
            shadow:   "shadow-amber-200",
          },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">{card.label}</p>
              <p className="text-3xl font-black text-gray-900">
                {card.value}{" "}
                {card.unit && <span className="text-base font-semibold text-gray-400">{card.unit}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Chart + Low Stock ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Sales Chart */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="mb-6">
            <h3 className="text-xl font-black text-gray-900">ยอดขาย 7 วันย้อนหลัง</h3>
            <p className="text-sm text-gray-500 font-medium mt-1">แสดงแนวโน้มรายได้ย้อนหลังแบบรายวัน</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={v => `฿${v}`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: any) => [`฿${Number(v || 0).toLocaleString()}`, "ยอดขาย"]}
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="ยอดขาย" stroke="#7c3aed" strokeWidth={3} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-2.5 rounded-xl text-white shadow-sm shadow-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-gray-900">สินค้าใกล้หมด</h3>
          </div>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-rose-50/60 border border-rose-100 hover:bg-rose-100/40 transition-colors">
                <div>
                  <p className="font-black text-gray-900 text-sm">{item.name}</p>
                  {item.variant && <p className="text-xs text-gray-400 font-medium mt-0.5">{item.variant}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-rose-600">{item.stock}</p>
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wide">ชิ้น</p>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="bg-gray-50 rounded-full p-4 ring-8 ring-gray-50/50">
                  <AlertTriangle className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium text-sm">สต็อกสินค้าปกติทั้งหมด</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Top Products + Recent Orders + Near Expiry ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Top 5 สินค้าขายดี */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 rounded-xl text-white shadow-sm shadow-amber-200">
                <Trophy className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-gray-900">สินค้าขายดี</h3>
            </div>
            <Link href="/admin/Stock" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              ดูทั้งหมด <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topProducts.length > 0 ? topProducts.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 text-white shadow-md ${RANK_STYLE[i]}`}>
                  {item.rank}
                </div>
                {item.image ? (
                  <img src={item.image} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shrink-0" alt={item.name} />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-gray-900 text-sm truncate">{item.name}</p>
                  {item.variant && <p className="text-[11px] text-gray-400 font-medium truncate">{item.variant}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-gray-900 text-sm">{item.quantity}</p>
                  <p className="text-[10px] text-gray-400 font-bold">ชิ้น</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400 font-medium text-sm">ยังไม่มีข้อมูล</div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-sm shadow-indigo-200">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-gray-900">ออเดอร์ล่าสุด</h3>
            </div>
            <Link href="/admin/SaleItem" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              ดูทั้งหมด <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors gap-3">
                <div className="min-w-0">
                  <p className="font-black text-gray-900 text-sm truncate">{order.customerName}</p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="font-black text-gray-900 text-sm">฿{order.totalAmount.toLocaleString()}</p>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_STYLE[order.status] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Near Expiry Materials */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-2.5 rounded-xl text-white shadow-sm shadow-orange-200">
                <FlaskConical className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-gray-900">วัตถุดิบใกล้หมดอายุ</h3>
            </div>
            <Link href="/admin/Material" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              ดูทั้งหมด <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {nearExpiryMaterials.length > 0 ? nearExpiryMaterials.map(lot => {
              const daysLeft = Math.ceil((new Date(lot.expireDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              const urgent   = daysLeft <= 7
              return (
                <div key={lot.id} className={`p-3 rounded-2xl border transition-colors ${urgent ? "bg-rose-50/60 border-rose-100" : "bg-amber-50/60 border-amber-100"}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 text-sm truncate">{lot.materialName}</p>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">Lot: {lot.lotNumber}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border shrink-0 ${urgent ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-amber-100 text-amber-600 border-amber-200"}`}>
                      {daysLeft} วัน
                    </span>
                  </div>
                  <p className="text-[11px] font-bold mt-1.5 text-gray-500">
                    คงเหลือ {Number(lot.stock).toLocaleString()} {lot.unit}
                  </p>
                </div>
              )
            }) : (
              <div className="flex flex-col items-center gap-3 py-10">
                <div className="bg-gray-50 rounded-full p-4 ring-8 ring-gray-50/50">
                  <FlaskConical className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium text-sm">ไม่มีวัตถุดิบใกล้หมดอายุ</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}