"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ShoppingBag, Package, Trash2, Search, ChevronDown, Download, FileText, FileSpreadsheet, X, Calendar } from "lucide-react"

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
  { value: "return",  label: "คืนสต็อก" },
] as const

type FilterValue = typeof FILTERS[number]["value"]

const BADGE_CLASS: Record<string, string> = {
  sale:         "bg-emerald-100 text-emerald-700 border-emerald-200",
  offline_sale: "bg-teal-100 text-teal-700 border-teal-200",
  material:     "bg-blue-100 text-blue-700 border-blue-200",
  product:      "bg-blue-100 text-blue-700 border-blue-200",
  expired:      "bg-rose-100 text-rose-700 border-rose-200",
  damaged:      "bg-orange-100 text-orange-700 border-orange-200",
  return:       "bg-gray-100 text-gray-600 border-gray-200",
}

const BADGE_LABEL: Record<string, string> = {
  sale:         "ออนไลน์",
  offline_sale: "หน้าร้าน",
  material:     "ทุนวัตถุดิบ",
  product:      "ทุนสินค้า",
  expired:      "หมดอายุ",
  damaged:      "ชำรุด",
  return:       "คืนสต็อก",
}

const AMOUNT_CLASS: Record<string, string> = {
  sale:         "text-emerald-600",
  offline_sale: "text-teal-600",
  material:     "text-blue-600",
  product:      "text-blue-600",
  expired:      "text-rose-600",
  damaged:      "text-orange-500",
  return:       "text-gray-500",
}

// ── Export helpers ────────────────────────────────────────────────────────────

function exportCSV(rows: Trx[], filterLabel: string, dateLabel: string) {
  const headers = ["วันที่", "เวลา", "รหัสอ้างอิง", "รายการ", "ประเภท", "จำนวนเงิน (฿)"]
  const csvRows = rows.map(t => [
    new Date(t.date).toLocaleDateString("th-TH"),
    new Date(t.date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
    t.displayCode,
    `"${t.description.replace(/"/g, '""')}"`,
    BADGE_LABEL[t.subtype] || t.subtype,
    `${t.type === "income" ? "" : "-"}${t.amount.toFixed(2)}`,
  ])
  const totalIncome  = rows.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = rows.filter(t => t.type !== "income").reduce((s, t) => s + t.amount, 0)
  const content = [
    `"Financial Report — ${filterLabel} | ${dateLabel}"`,
    `"วันที่ออก: ${new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}"`,
    "",
    headers.join(","),
    ...csvRows.map(r => r.join(",")),
    "",
    `"รายรับรวม",,,,,${totalIncome.toFixed(2)}`,
    `"รายจ่ายรวม",,,,,${totalExpense.toFixed(2)}`,
    `"กำไรสุทธิ",,,,,${(totalIncome - totalExpense).toFixed(2)}`,
  ].join("\n")
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(rows: Trx[], filterLabel: string, dateLabel: string) {
  const totalIncome  = rows.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = rows.filter(t => t.type !== "income").reduce((s, t) => s + t.amount, 0)
  const profit = totalIncome - totalExpense
  const tableRows = rows.map(t => `
    <tr>
      <td>${new Date(t.date).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}<br/>
        <small style="color:#9ca3af">${new Date(t.date).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}</small>
      </td>
      <td><code>${t.displayCode}</code></td>
      <td>${t.description}</td>
      <td><span class="badge ${t.subtype}">${BADGE_LABEL[t.subtype] || t.subtype}</span></td>
      <td class="amount ${t.type === "income" ? "income" : "expense"}">
        ${t.type === "income" ? "+" : "-"}฿${t.amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
      </td>
    </tr>`).join("")

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"/>
<title>Financial Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Sarabun',sans-serif; font-size:12px; color:#1f2937; background:#fff; padding:32px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #e5e7eb; }
  .header h1 { font-size:22px; font-weight:800; color:#4f46e5; }
  .header p  { color:#6b7280; margin-top:4px; font-size:12px; }
  .chips { display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
  .chip { display:inline-block; background:#eef2ff; color:#4f46e5; border:1px solid #c7d2fe; border-radius:8px; padding:2px 10px; font-size:11px; font-weight:700; }
  .summary { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
  .summary-card { border-radius:12px; padding:12px 16px; }
  .summary-card.green  { background:#f0fdf4; border:1px solid #bbf7d0; }
  .summary-card.red    { background:#fff1f2; border:1px solid #fecdd3; }
  .summary-card.indigo { background:#eef2ff; border:1px solid #c7d2fe; }
  .summary-card label  { font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; }
  .summary-card .val   { font-size:18px; font-weight:800; margin-top:4px; }
  .summary-card.green .val  { color:#059669; }
  .summary-card.red .val    { color:#e11d48; }
  .summary-card.indigo .val { color:#4f46e5; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#f9fafb; }
  th { padding:9px 12px; text-align:left; font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e5e7eb; }
  td { padding:8px 12px; border-bottom:1px solid #f3f4f6; vertical-align:middle; }
  code { font-family:monospace; font-size:10px; background:#f3f4f6; padding:2px 6px; border-radius:4px; color:#4b5563; }
  small { font-size:10px; }
  .amount { text-align:right; font-weight:800; font-size:13px; }
  .amount.income  { color:#059669; }
  .amount.expense { color:#e11d48; }
  .badge { display:inline-block; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700; }
  .badge.sale,.badge.offline_sale { background:#d1fae5; color:#065f46; }
  .badge.material,.badge.product  { background:#dbeafe; color:#1e40af; }
  .badge.expired  { background:#ffe4e6; color:#9f1239; }
  .badge.damaged  { background:#ffedd5; color:#9a3412; }
  .badge.return   { background:#f3f4f6; color:#374151; }
  .footer { margin-top:20px; padding-top:12px; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; color:#9ca3af; font-size:10px; }
</style></head><body>
  <div class="header">
    <div>
      <h1>Financial Report</h1>
      <p>รายงานการเงิน — สร้างโดยระบบอัตโนมัติ</p>
      <div class="chips">
        <span class="chip">ตัวกรอง: ${filterLabel}</span>
        <span class="chip">ช่วงเวลา: ${dateLabel}</span>
      </div>
    </div>
    <div style="text-align:right;font-size:11px;color:#9ca3af">
      วันที่ออกรายงาน:<br/>${new Date().toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}
    </div>
  </div>
  <div class="summary">
    <div class="summary-card green"><label>รายรับรวม</label><div class="val">฿${totalIncome.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div></div>
    <div class="summary-card red"><label>รายจ่ายรวม</label><div class="val">฿${totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div></div>
    <div class="summary-card indigo"><label>กำไรสุทธิ</label><div class="val">฿${profit.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</div></div>
  </div>
  <table>
    <thead><tr><th>วันที่</th><th>รหัสอ้างอิง</th><th>รายการ</th><th>ประเภท</th><th style="text-align:right">จำนวนเงิน</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer"><span>Financial Report</span><span>รวม ${rows.length} รายการ</span></div>
  <script>window.onload=()=>window.print()</script>
</body></html>`

  const win = window.open("", "_blank")
  if (win) { win.document.write(html); win.document.close() }
}

// ── Export Modal ──────────────────────────────────────────────────────────────

function ExportModal({
  open, onClose, transactions,
}: {
  open: boolean
  onClose: () => void
  transactions: Trx[]
}) {
  const [expFilter, setExpFilter] = useState<FilterValue>("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo,   setDateTo]   = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) { setExpFilter("ALL"); setDateFrom(""); setDateTo("") }
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const preview = useMemo(() => {
    return transactions.filter(t => {
      const matchFilter =
        expFilter === "ALL"     ? true :
        expFilter === "income"  ? t.type === "income" :
        expFilter === "expense" ? t.type === "expense" :
        t.subtype === expFilter
      const d = new Date(t.date)
      const matchFrom = dateFrom ? d >= new Date(dateFrom) : true
      const matchTo   = dateTo   ? d <= new Date(dateTo + "T23:59:59") : true
      return matchFilter && matchFrom && matchTo
    })
  }, [transactions, expFilter, dateFrom, dateTo])

  const totalIncome  = preview.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = preview.filter(t => t.type !== "income").reduce((s, t) => s + t.amount, 0)

  const filterLabel = FILTERS.find(f => f.value === expFilter)?.label || "ทั้งหมด"
  const dateLabel   = dateFrom && dateTo
    ? `${new Date(dateFrom).toLocaleDateString("th-TH", { day: "2-digit", month: "short" })} – ${new Date(dateTo).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}`
    : dateFrom ? `ตั้งแต่ ${new Date(dateFrom).toLocaleDateString("th-TH")}` :
      dateTo   ? `ถึง ${new Date(dateTo).toLocaleDateString("th-TH")}` : "ทุกช่วงเวลา"

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2 rounded-xl"><Download className="w-5 h-5" /></div>
            <div>
              <h2 className="text-lg font-black">Export รายงานการเงิน</h2>
              <p className="text-indigo-100 text-xs">เลือกช่วงข้อมูลก่อนดาวน์โหลด</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ประเภทรายการ</label>
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 bg-white hover:border-indigo-300 transition-all cursor-pointer"
              >
                {filterLabel}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`} />
              </button>
              {filterOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  {FILTERS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => { setExpFilter(opt.value); setFilterOpen(false) }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer ${expFilter === opt.value ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"}`}
                    >
                      {opt.label}
                      <span className="text-xs text-gray-400">
                        {opt.value === "ALL" ? transactions.length :
                         opt.value === "income"  ? transactions.filter(t => t.type === "income").length :
                         opt.value === "expense" ? transactions.filter(t => t.type === "expense").length :
                         transactions.filter(t => t.subtype === opt.value).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ช่วงวันที่</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">ตั้งแต่</p>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">ถึง</p>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    min={dateFrom}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {[
                { label: "7 วันล่าสุด",  days: 7 },
                { label: "30 วันล่าสุด", days: 30 },
                { label: "90 วันล่าสุด", days: 90 },
              ].map(preset => {
                const to   = new Date()
                const from = new Date(); from.setDate(from.getDate() - preset.days)
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setDateFrom(from.toISOString().slice(0, 10))
                      setDateTo(to.toISOString().slice(0, 10))
                    }}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                )
              })}
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo("") }}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  ล้าง
                </button>
              )}
            </div>
          </div>

          {/* Preview summary */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">ตัวอย่างข้อมูลที่จะ Export</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-gray-400 font-medium">รายการ</p>
                <p className="text-lg font-black text-gray-900">{preview.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">รายรับ</p>
                <p className="text-sm font-black text-emerald-600">฿{totalIncome.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">รายจ่าย</p>
                <p className="text-sm font-black text-rose-600">฿{totalExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { exportCSV(preview, filterLabel, dateLabel); onClose() }}
              disabled={preview.length === 0}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => { exportPDF(preview, filterLabel, dateLabel); onClose() }}
              disabled={preview.length === 0}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-sm hover:bg-rose-100 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function FinanceTable({ transactions }: { transactions: Trx[] }) {
  const [filter, setFilter] = useState<FilterValue>("ALL")
  const [search, setSearch] = useState("")
  const [filterOpen, setFilterOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const getCount = (value: string) =>
    value === "ALL"     ? transactions.length :
    value === "income"  ? transactions.filter(t => t.type === "income").length :
    value === "expense" ? transactions.filter(t => t.type === "expense").length :
    transactions.filter(t => t.subtype === value).length

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

  const currentFilter = FILTERS.find(f => f.value === filter)!

  return (
    <>
      <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} transactions={transactions} />

      {/* Toolbar */}
      <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="ค้นหารายการ, รหัสอ้างอิง..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-55 md:w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative shrink-0" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm cursor-pointer whitespace-nowrap hover:border-purple-300 transition-all"
            >
              <span className="hidden sm:inline">{currentFilter.label}</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">{getCount(filter)}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {FILTERS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setFilterOpen(false) }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                      filter === opt.value ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                    }`}
                  >
                    {opt.label}
                    <span className="text-[10px] text-gray-400">{getCount(opt.value)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export button */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 shadow-sm cursor-pointer transition-all whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
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
                  <div className="md:hidden mt-1">
                    <span className="font-mono text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-lg">{trx.displayCode}</span>
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-5">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl font-semibold">{trx.displayCode}</span>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-5">
                  <div className="flex items-center gap-2">
                    {trx.subtype === "sale"         && <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 shrink-0" />}
                    {trx.subtype === "offline_sale" && <ShoppingBag className="w-3.5 h-3.5 md:w-4 md:h-4 text-teal-500 shrink-0" />}
                    {(trx.subtype === "material" || trx.subtype === "product") && <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-400 shrink-0" />}
                    {(trx.subtype === "expired"  || trx.subtype === "damaged")  && <Trash2  className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-500 shrink-0" />}
                    {trx.subtype === "return"       && <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 shrink-0" />}
                    <div>
                      <p className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors text-xs md:text-sm">{trx.description}</p>
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