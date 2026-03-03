"use client"

import { useState } from "react"
import { Search, ArrowDownToLine, ArrowUpFromLine, Package, Hammer, Calendar, Factory, ClipboardList } from "lucide-react"
import dayjs from "dayjs"
import 'dayjs/locale/th'

dayjs.locale('th')

type Transaction = {
  id: string
  date: Date
  type: string
  reason: string | null
  category: string
  itemName: string
  amount: number
  unit: string
  totalCost: number | null
  note: string | null
  creatorName: string
  creatorImage: string | null
  productionDocNo: string | null
  lotNumber: string | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: "in" | "out" }> = {
  NEW_PURCHASE: { label: "รับเข้าซื้อ",  color: "text-green-600 bg-green-50 border-green-200",    icon: "in"  },
  PRODUCTION:   { label: "รับจากผลิต",   color: "text-teal-600 bg-teal-50 border-teal-200",      icon: "in"  },
  RETURN:       { label: "ลูกค้าคืน",    color: "text-purple-600 bg-purple-50 border-purple-200", icon: "in"  },
  AUDIT:        { label: "ปรับยอด",      color: "text-gray-600 bg-gray-100 border-gray-200",      icon: "out" },
  SALE:         { label: "ขายออก",       color: "text-orange-600 bg-orange-50 border-orange-200", icon: "out" },
  DAMAGED:      { label: "ของชำรุด",     color: "text-red-500 bg-red-50 border-red-200",          icon: "out" },
  EXPIRED:      { label: "หมดอายุ",      color: "text-red-700 bg-red-100 border-red-300",         icon: "out" },
  IN:           { label: "รับเข้า",      color: "text-green-600 bg-green-50 border-green-200",    icon: "in"  },
  PROD_IN:      { label: "รับเข้าผลิต", color: "text-teal-600 bg-teal-50 border-teal-200",       icon: "in"  },
  OUT:          { label: "เบิกออก",      color: "text-orange-600 bg-orange-50 border-orange-200", icon: "out" },
  SALE_OUT:     { label: "ขายออก",       color: "text-orange-600 bg-orange-50 border-orange-200", icon: "out" },
  ADJUST_OUT:   { label: "ปรับลดสต็อก", color: "text-red-600 bg-red-50 border-red-200",          icon: "out" },
  PROD_OUT:     { label: "เบิกผลิต",     color: "text-orange-600 bg-orange-50 border-orange-200", icon: "out" },
}

const IN_TYPES  = ["IN", "PROD_IN"]
const OUT_TYPES = ["OUT", "SALE_OUT", "ADJUST_OUT", "PROD_OUT"]

export default function HistoryClient({ initialData }: { initialData: Transaction[] }) {
  const [search, setSearch]               = useState("")
  const [filterCategory, setFilterCategory] = useState<"ALL" | "MATERIAL" | "PRODUCT" | "PRODUCTION">("ALL")
  const [filterType, setFilterType]       = useState<"ALL" | "IN" | "OUT">("ALL")

  const filteredData = initialData.filter((tx) => {
    const s = search.toLowerCase()
    const matchSearch =
      tx.itemName.toLowerCase().includes(s) ||
      (tx.note && tx.note.toLowerCase().includes(s)) ||
      (tx.productionDocNo && tx.productionDocNo.toLowerCase().includes(s)) ||
      (tx.lotNumber && tx.lotNumber.toLowerCase().includes(s))

    const matchCategory =
      filterCategory === "ALL" ? true
      : filterCategory === "PRODUCTION" ? ["PROD_IN", "PROD_OUT"].includes(tx.type)
      : tx.category === filterCategory

    const matchType =
      filterType === "ALL" ? true
      : filterType === "IN"  ? IN_TYPES.includes(tx.type)
      : OUT_TYPES.includes(tx.type)

    return matchSearch && matchCategory && matchType
  })

  const totalIn   = initialData.filter(tx => IN_TYPES.includes(tx.type)).length
  const totalOut  = initialData.filter(tx => OUT_TYPES.includes(tx.type)).length
  const totalProd = initialData.filter(tx => ["PROD_IN", "PROD_OUT"].includes(tx.type)).length

  const CATEGORY_FILTERS = [
    { value: "ALL",        label: "ทั้งหมด",  count: initialData.length,                                        activeClass: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md" },
    { value: "MATERIAL",   label: "วัตถุดิบ", count: initialData.filter(t => t.category === "MATERIAL").length, activeClass: "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md", icon: <Hammer className="w-3.5 h-3.5" /> },
    { value: "PRODUCT",    label: "สินค้า",   count: initialData.filter(t => t.category === "PRODUCT").length,  activeClass: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md",  icon: <Package className="w-3.5 h-3.5" /> },
    { value: "PRODUCTION", label: "การผลิต",  count: totalProd,                                                 activeClass: "bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow-md", icon: <Factory className="w-3.5 h-3.5" /> },
  ] as const

  const TYPE_FILTERS = [
    { value: "ALL", label: "เข้า/ออก", activeClass: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md" },
    { value: "IN",  label: "รับเข้า",  activeClass: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md", icon: <ArrowDownToLine className="w-3.5 h-3.5" /> },
    { value: "OUT", label: "เบิกออก",  activeClass: "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md",    icon: <ArrowUpFromLine className="w-3.5 h-3.5" /> },
  ] as const

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Transactions History</h1>
          <p className="text-[16px] text-gray-500 font-medium mt-1">ความเคลื่อนไหวของวัตถุดิบและสต๊อกสินค้าทั้งหมดในระบบ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "รายการทั้งหมด", value: initialData.length, icon: <ClipboardList className="w-6 h-6" />, gradient: "from-indigo-500 to-purple-600", shadow: "shadow-purple-200" },
          { label: "รับเข้า",       value: totalIn,            icon: <ArrowDownToLine className="w-6 h-6" />, gradient: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-200" },
          { label: "เบิกออก",       value: totalOut,           icon: <ArrowUpFromLine className="w-6 h-6" />, gradient: "from-rose-500 to-red-600",     shadow: "shadow-rose-200"    },
          { label: "การผลิต",       value: totalProd,          icon: <Factory className="w-6 h-6" />,         gradient: "from-teal-400 to-emerald-500", shadow: "shadow-teal-200"    },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">{card.label}</p>
              <p className="text-3xl font-black text-gray-900">
                {card.value.toLocaleString()} <span className="text-base font-semibold text-gray-400">รายการ</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between bg-gray-50/30">

          {/* Search */}
          <div className="relative w-56 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="ค้นหาชื่อรายการ, หมายเหตุ, ล็อต..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Category filter */}
            <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner gap-1">
              {CATEGORY_FILTERS.map(opt => {
                const isActive = filterCategory === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilterCategory(opt.value as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      isActive ? opt.activeClass : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                    }`}
                  >
                    {"icon" in opt ? opt.icon : null}
                    {opt.label}
                    <span className={`py-0.5 px-2 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                      {opt.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Type filter */}
            <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner gap-1">
              {TYPE_FILTERS.map(opt => {
                const isActive = filterType === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      isActive ? opt.activeClass : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                    }`}
                  >
                    {"icon" in opt ? opt.icon : null}
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["วัน-เวลา", "ใบผลิต / ล็อต", "สถานะ", "ชื่อรายการ / หมายเหตุ", "จำนวน", "ผู้ทำรายการ"].map(h => (
                  <th key={h} className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                        <Search className="w-10 h-10 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-lg">ไม่พบข้อมูล</p>
                        <p className="text-gray-400 font-medium mt-1">ไม่มีประวัติการทำรายการที่ตรงกับเงื่อนไข</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(tx => {
                  const isIn = IN_TYPES.includes(tx.type)
                  const statusKey = tx.reason || tx.type
                  const status = STATUS_MAP[statusKey] ?? { label: statusKey, color: "text-gray-500 bg-gray-100 border-gray-200", icon: "out" as const }

                  return (
                    <tr key={tx.id} className="hover:bg-indigo-50/20 transition-colors group">

                      {/* วัน-เวลา */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-800">{dayjs(tx.date).format("DD MMM YYYY")}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{dayjs(tx.date).format("HH:mm น.")}</div>
                      </td>

                      {/* ใบผลิต / ล็อต */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {tx.productionDocNo && (
                            <span className="inline-flex items-center text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-fit">
                              <Factory className="w-3 h-3 mr-1" /> {tx.productionDocNo}
                            </span>
                          )}
                          {tx.lotNumber && (
                            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 w-fit">
                              LOT: {tx.lotNumber}
                            </span>
                          )}
                          {!tx.productionDocNo && !tx.lotNumber && (
                            <span className="text-[11px] text-gray-300">-</span>
                          )}
                        </div>
                      </td>

                      {/* สถานะ */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border ${status.color}`}>
                          {status.icon === "in"
                            ? <ArrowDownToLine className="w-3.5 h-3.5" />
                            : <ArrowUpFromLine className="w-3.5 h-3.5" />}
                          {status.label}
                        </span>
                      </td>

                      {/* ชื่อรายการ + ประเภท + หมายเหตุ */}
                      <td className="px-4 py-4 min-w-[200px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          {tx.category === "MATERIAL" ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-500 border border-orange-100">
                              <Hammer className="w-2.5 h-2.5" /> วัตถุดิบ
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-500 border border-blue-100">
                              <Package className="w-2.5 h-2.5" /> สินค้า
                            </span>
                          )}
                        </div>
                        <p className="font-black text-gray-900 group-hover:text-indigo-700 transition-colors">{tx.itemName}</p>
                        {tx.note && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{tx.note}</p>}
                      </td>

                      {/* จำนวน */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <span className={`font-black text-base ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIn ? "+" : "-"}{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">{tx.unit}</span>
                        {tx.totalCost && (
                          <div className="text-xs text-gray-400 mt-0.5">฿{tx.totalCost.toLocaleString()}</div>
                        )}
                      </td>

                      {/* ผู้ทำรายการ */}
                      <td className="px-4 py-4 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          {tx.creatorImage ? (
                            <img src={tx.creatorImage} alt={tx.creatorName} className="w-7 h-7 rounded-full object-cover border border-gray-200 shadow-sm shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-black uppercase shrink-0">
                              {tx.creatorName?.charAt(0) || "S"}
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-700">{tx.creatorName}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredData.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">
              แสดงผลทั้งหมด <strong className="text-gray-900">{filteredData.length}</strong> รายการ
            </span>
          </div>
        )}
      </div>
    </div>
  )
}