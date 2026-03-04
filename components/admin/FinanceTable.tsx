"use client"

import { useState } from "react"
import { ShoppingBag, Package, Trash2, Search } from "lucide-react"

type Trx = {
  uniqueKey: string
  displayCode: string
  date: Date
  description: string
  type: string
  subtype: string
  amount: number
}

const FILTERS = [
  { value: "ALL",     label: "ทั้งหมด" },
  { value: "income",  label: "รายรับ" },
  { value: "expense", label: "รายจ่าย (ทุน)" },
  { value: "expired", label: "หมดอายุ" },
  { value: "damaged", label: "ชำรุด" },
] as const

type FilterValue = typeof FILTERS[number]["value"]

const ACTIVE_CLASS: Record<string, string> = {
  ALL:     "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md",
  income:  "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md",
  expense: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md",
  expired: "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md",
  damaged: "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md",
}

const BADGE_CLASS: Record<string, string> = {
  sale:         "bg-emerald-100 text-emerald-700 border-emerald-200",
  offline_sale: "bg-teal-100 text-teal-700 border-teal-200",
  material:     "bg-blue-100 text-blue-700 border-blue-200",
  product:      "bg-blue-100 text-blue-700 border-blue-200",
  expired:      "bg-rose-100 text-rose-700 border-rose-200",
  damaged:      "bg-orange-100 text-orange-700 border-orange-200",
}

const BADGE_LABEL: Record<string, string> = {
  sale:         "รายรับ (ออนไลน์)",
  offline_sale: "รายรับ (หน้าร้าน)",
  material:     "รายจ่าย (ทุน)",
  product:      "รายจ่าย (ทุนสินค้า)",
  expired:      "รายจ่าย (หมดอายุ)",
  damaged:      "รายจ่าย (ชำรุด)",
}

const AMOUNT_CLASS: Record<string, string> = {
  sale:         "text-emerald-600",
  offline_sale: "text-teal-600",
  material:     "text-blue-600",
  product:      "text-blue-600",
  expired:      "text-rose-600",
  damaged:      "text-orange-500",
}

export default function FinanceTable({ transactions }: { transactions: Trx[] }) {
  const [filter, setFilter] = useState<FilterValue>("ALL")
  const [search, setSearch] = useState("")

  const filtered = transactions.filter(t => {
    const matchFilter =
      filter === "ALL"     ? true :
      filter === "income"  ? t.type === "income" :
      filter === "expense" ? t.type === "expense" :
      t.subtype === filter

    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.displayCode.toLowerCase().includes(search.toLowerCase())

    return matchFilter && matchSearch
  })

  return (
    <>
      <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
          <input
            type="text"
            placeholder="ค้นหารายการ, รหัสอ้างอิง..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
          />
        </div>

        <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner flex-wrap gap-1">
          {FILTERS.map(opt => {
            const isActive = filter === opt.value
            const count =
              opt.value === "ALL"     ? transactions.length :
              opt.value === "income"  ? transactions.filter(t => t.type === "income").length :
              opt.value === "expense" ? transactions.filter(t => t.type === "expense").length :
              transactions.filter(t => t.subtype === opt.value).length

            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                  isActive ? ACTIVE_CLASS[opt.value] : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                }`}
              >
                {opt.label}
                <span className={`py-0.5 px-2 rounded-full text-[10px] ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              {["วันที่", "รหัสอ้างอิง", "รายการ", "ประเภท", "จำนวนเงิน (บาท)"].map(h => (
                <th key={h} className={`px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap ${h === "จำนวนเงิน (บาท)" ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                      <Search className="w-10 h-10 text-gray-300" />
                    </div>
                    <div>
                      <p className="text-gray-900 font-bold text-lg">ไม่พบข้อมูล</p>
                      <p className="text-gray-400 font-medium mt-1">ไม่มีรายการที่ตรงกับเงื่อนไขที่ค้นหา</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filtered.map(trx => (
              <tr key={trx.uniqueKey} className="hover:bg-indigo-50/20 transition-colors group">
                <td className="px-6 py-5 text-gray-500 text-xs font-medium whitespace-nowrap">
                  {new Date(trx.date).toLocaleString("th-TH", {
                    day: "2-digit", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-5">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl font-semibold">
                    {trx.displayCode}
                  </span>
                </td>
                <td className="px-6 py-5 min-w-[220px]">
                  <div className="flex items-center justify-center gap-2">
                    {trx.subtype === "sale"         && <ShoppingBag className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {trx.subtype === "offline_sale" && <ShoppingBag className="w-4 h-4 text-teal-500 shrink-0" />}
                    {(trx.subtype === "material" || trx.subtype === "product") && <Package className="w-4 h-4 text-blue-400 shrink-0" />}
                    {(trx.subtype === "expired" || trx.subtype === "damaged")  && <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />}
                    <span className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                      {trx.description}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${BADGE_CLASS[trx.subtype] || ""}`}>
                    {BADGE_LABEL[trx.subtype] || trx.subtype}
                  </span>
                </td>
                <td className={`px-6 py-5 text-right font-black text-base ${AMOUNT_CLASS[trx.subtype] || "text-gray-600"}`}>
                  {trx.type === "income" ? "+" : "-"}฿{trx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}