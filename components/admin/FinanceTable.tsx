"use client"

import { useState, useRef, useEffect } from "react"
import { ShoppingBag, Package, Trash2, Search, ChevronDown } from "lucide-react"

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
  { value: "ALL", label: "ทั้งหมด" },
  { value: "income", label: "รายรับ" },
  { value: "expense", label: "รายจ่าย (ทุน)" },
  { value: "expired", label: "หมดอายุ" },
  { value: "damaged", label: "ชำรุด" },
  { value: "return", label: "คืนสต็อก" },
] as const

type FilterValue = typeof FILTERS[number]["value"]

const ACTIVE_CLASS: Record<string, string> = {
  ALL: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md",
  income: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md",
  expense: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md",
  expired: "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md",
  damaged: "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md",
  return: "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-md",
}

const BADGE_CLASS: Record<string, string> = {
  sale: "bg-emerald-100 text-emerald-700 border-emerald-200",
  offline_sale: "bg-teal-100 text-teal-700 border-teal-200",
  material: "bg-blue-100 text-blue-700 border-blue-200",
  product: "bg-blue-100 text-blue-700 border-blue-200",
  expired: "bg-rose-100 text-rose-700 border-rose-200",
  damaged: "bg-orange-100 text-orange-700 border-orange-200",
  return: "bg-gray-100 text-gray-600 border-gray-200",
}

const BADGE_LABEL: Record<string, string> = {
  sale: "ออนไลน์",
  offline_sale: "หน้าร้าน",
  material: "ทุนวัตถุดิบ",
  product: "ทุนสินค้า",
  expired: "หมดอายุ",
  damaged: "ชำรุด",
  return: "คืนสต็อก",
}

const AMOUNT_CLASS: Record<string, string> = {
  sale: "text-emerald-600",
  offline_sale: "text-teal-600",
  material: "text-blue-600",
  product: "text-blue-600",
  expired: "text-rose-600",
  damaged: "text-orange-500",
  return: "text-gray-500",
}

export default function FinanceTable({ transactions }: { transactions: Trx[] }) {
  const [filter, setFilter] = useState<FilterValue>("ALL")
  const [search, setSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const getCount = (value: string) =>
    value === "ALL" ? transactions.length :
    value === "income" ? transactions.filter(t => t.type === "income").length :
    value === "expense" ? transactions.filter(t => t.type === "expense").length :
    transactions.filter(t => t.subtype === value).length

  const filtered = transactions.filter(t => {
    const matchFilter =
      filter === "ALL" ? true :
      filter === "income" ? t.type === "income" :
      filter === "expense" ? t.type === "expense" :
      t.subtype === filter
    const matchSearch =
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.displayCode.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const currentFilter = FILTERS.find(f => f.value === filter)!

  return (
    <>
      {/* Toolbar */}
      <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/30">

        {/* Mobile */}
        <div className="flex gap-2 md:hidden">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="ค้นหารายการ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
            />
          </div>
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm cursor-pointer whitespace-nowrap"
            >
              {currentFilter.label}
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
                {getCount(filter)}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {FILTERS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setDropdownOpen(false) }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                      filter === opt.value
                        ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500"
                        : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    {opt.label}
                    <span className="text-[10px] text-gray-400">{getCount(opt.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex justify-between items-center gap-4">
          <div className="relative w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="ค้นหารายการ, รหัสอ้างอิง..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
            />
          </div>
          <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner gap-1">
            {FILTERS.map(opt => {
              const isActive = filter === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                    isActive ? ACTIVE_CLASS[opt.value] : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                  }`}
                >
                  {opt.label}
                  <span className={`py-0.5 px-2 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {getCount(opt.value)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="px-3 md:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-left">วันที่</th>
              <th className="hidden md:table-cell px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-left">รหัสอ้างอิง</th>
              <th className="px-3 md:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-left">รายการ</th>
              <th className="hidden sm:table-cell px-3 md:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-center">ประเภท</th>
              <th className="px-3 md:px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">จำนวนเงิน</th>
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

                <td className="px-3 md:px-6 py-3 md:py-5 whitespace-nowrap">
                  <div className="text-xs md:text-sm font-bold text-gray-700">
                    {new Date(trx.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <div className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                    {new Date(trx.date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  {/* mobile: ref code */}
                  <div className="md:hidden mt-1">
                    <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-lg">
                      {trx.displayCode}
                    </span>
                  </div>
                </td>

                <td className="hidden md:table-cell px-6 py-5">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl font-semibold">
                    {trx.displayCode}
                  </span>
                </td>

                <td className="px-3 md:px-6 py-3 md:py-5">
                  <div className="flex items-center gap-2">
                    {trx.subtype === "sale" && <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0" />}
                    {trx.subtype === "offline_sale" && <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-500 shrink-0" />}
                    {(trx.subtype === "material" || trx.subtype === "product") && <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 shrink-0" />}
                    {(trx.subtype === "expired" || trx.subtype === "damaged") && <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500 shrink-0" />}
                    {trx.subtype === "return" && <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />}
                    <div>
                      <p className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors text-xs md:text-sm">
                        {trx.description}
                      </p>
                      {/* mobile: badge inline */}
                      <div className="sm:hidden mt-0.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${BADGE_CLASS[trx.subtype] || ""}`}>
                          {BADGE_LABEL[trx.subtype] || trx.subtype}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                <td className="hidden sm:table-cell px-3 md:px-6 py-5 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${BADGE_CLASS[trx.subtype] || ""}`}>
                    {BADGE_LABEL[trx.subtype] || trx.subtype}
                  </span>
                </td>

                <td className={`px-3 md:px-6 py-3 md:py-5 text-right font-black text-sm md:text-base whitespace-nowrap ${AMOUNT_CLASS[trx.subtype] || "text-gray-600"}`}>
                  {trx.type === "income" ? "+" : "-"}฿{trx.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-4 md:px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center rounded-b-3xl">
          <span className="text-sm font-medium text-gray-500">
            แสดงผล <strong className="text-gray-900">{filtered.length}</strong> รายการ
          </span>
        </div>
      )}
    </>
  )
}