"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search, ChevronDown, PackagePlus, FileText, Edit, Plus, BookOpen,
  PackageSearch, ArrowDownToLine, ArrowUpFromLine, Layers,
  Package, AlertTriangle, BoxesIcon, BarChart3
} from "lucide-react"

import AddProductModal from "./AddProductModal"
import EditProductModal from "./EditProductModal"
import ProductSlipModal from "./ProductSlipModal"
import ProductRecipeModal from "./ProductRecipeModal"
import AdjustStockModal from "./AdjustStockModal"
import ReceiveProduceModal from "./ReceiveProduceModal"
import ProductLotModal from "./ProductLotModal"
import DispatchProductModal from "./DispatchProductModal"

type StockItem = {
  Pid: number
  productCode: string
  name: string
  stock: number
  imageUrl?: string | null
}

type Stats = {
  totalProducts: number
  outOfStock: number
  lowStock: number
  totalStock: number
}

const SORT_OPTIONS = [
  { value: "newest", label: "เพิ่มล่าสุด" },
  { value: "oldest", label: "เก่าสุด" },
  { value: "stock-high", label: "สต็อก (มากไปน้อย)" },
  { value: "stock-low", label: "สต็อก (น้อยไปมาก)" },
  { value: "name-az", label: "ชื่อ (A-Z)" },
  { value: "name-za", label: "ชื่อ (Z-A)" },
] as const

type SortValue = typeof SORT_OPTIONS[number]["value"]

function ActionMenu({ canAdjustStock, onAdjust, onDispatch, onLot, onEdit, onSlip }: {
  canAdjustStock: boolean
  onAdjust: () => void
  onDispatch: () => void
  onLot: () => void
  onEdit: () => void
  onSlip: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold cursor-pointer transition-all"
      >
        <span className="hidden sm:inline">จัดการ</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {canAdjustStock && (
            <>
              <button onClick={() => { onAdjust(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
                <ArrowDownToLine className="w-3.5 h-3.5" /> รับเข้า
              </button>
              <button onClick={() => { onDispatch(); setOpen(false) }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer">
                <ArrowUpFromLine className="w-3.5 h-3.5" /> เบิกออก
              </button>
            </>
          )}
          <button onClick={() => { onLot(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-50 cursor-pointer">
            <Layers className="w-3.5 h-3.5" /> ล็อต
          </button>
          <button onClick={() => { onEdit(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer">
            <Edit className="w-3.5 h-3.5" /> รายละเอียด
          </button>
          <button onClick={() => { onSlip(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 cursor-pointer">
            <FileText className="w-3.5 h-3.5" /> ประวัติ
          </button>
        </div>
      )}
    </div>
  )
}

export default function StockTable({
  data,
  userRole,
  stats,
}: {
  data: StockItem[]
  userRole: string
  stats: Stats
}) {
  const canAdjustStock = userRole === "ADMIN" || userRole === "MANAGER"
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortValue>("newest")
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  const [isReceiveProduceOpen, setIsReceiveProduceOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)
  const [slipModalOpen, setSlipModalOpen] = useState(false)
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null)
  const [selectedSlipName, setSelectedSlipName] = useState("")
  const [lotModalOpen, setLotModalOpen] = useState(false)
  const [selectedLotProductCode, setSelectedLotProductCode] = useState("")
  const [selectedLotProductId, setSelectedLotProductId] = useState<number | null>(null)
  const [selectedLotProductName, setSelectedLotProductName] = useState("")
  const [adjustStockOpen, setAdjustStockOpen] = useState(false)
  const [adjustProductId, setAdjustProductId] = useState<number | null>(null)
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [dispatchProductId, setDispatchProductId] = useState<number | null>(null)
  const [dispatchProductName, setDispatchProductName] = useState("")

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filteredAndSorted = useMemo(() => {
    let result = data.filter(
      item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.productCode.toLowerCase().includes(search.toLowerCase())
    )
    switch (sort) {
      case "stock-high": result.sort((a, b) => b.stock - a.stock); break
      case "stock-low": result.sort((a, b) => a.stock - b.stock); break
      case "name-az": result.sort((a, b) => a.name.localeCompare(b.name)); break
      case "name-za": result.sort((a, b) => b.name.localeCompare(a.name)); break
      case "oldest": result = [...result].reverse(); break
    }
    return result
  }, [data, search, sort])

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <PackageSearch className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Product Inventory</h1>
          <p className="text-[16px] text-gray-500 font-medium mt-1">จัดการข้อมูลสินค้า สูตรการผลิต และตรวจสอบจำนวนคงเหลือ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "สินค้าทั้งหมด", value: stats.totalProducts, unit: "รายการ", icon: <Package className="w-5 h-5 md:w-6 md:h-6" />, gradient: "from-indigo-500 to-purple-600", shadow: "shadow-purple-200" },
          { label: "สต็อกรวม", value: stats.totalStock, unit: "ชิ้น", icon: <BoxesIcon className="w-5 h-5 md:w-6 md:h-6" />, gradient: "from-blue-400 to-indigo-500", shadow: "shadow-blue-200" },
          { label: "สต็อกต่ำ (≤5)", value: stats.lowStock, unit: "รายการ", icon: <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />, gradient: "from-orange-400 to-amber-500", shadow: "shadow-orange-200" },
          { label: "หมดสต็อก", value: stats.outOfStock, unit: "รายการ", icon: <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />, gradient: "from-rose-500 to-red-600", shadow: "shadow-rose-200" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-4 md:p-6 flex items-center gap-3 md:gap-5 group">
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-3 md:p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500 font-bold mb-1">{card.label}</p>
              <p className="text-xl md:text-3xl font-black text-gray-900">
                {card.value.toLocaleString()} <span className="text-xs md:text-base font-semibold text-gray-400">{card.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100">

        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/30 rounded-t-3xl">
          {/* Mobile: search แยกบน */}
          <div className="md:hidden mb-3">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Desktop: ทุกอย่างแถวเดียว | Mobile: sort + ปุ่ม */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Search — desktop only */}
            <div className="relative hidden md:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-purple-500 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
              />
            </div>

            {/* Sort */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between border border-gray-200 rounded-2xl px-3 py-2.5 text-sm bg-white hover:border-purple-300 focus:outline-none transition-all shadow-sm cursor-pointer font-bold text-gray-700 gap-2"
              >
                {SORT_OPTIONS.find(o => o.value === sort)?.label}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSortOpen ? "rotate-180 text-purple-500" : ""}`} />
              </button>
              {isSortOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1.5">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setIsSortOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${sort === opt.value
                          ? "bg-purple-50 text-purple-700 font-bold border-l-4 border-purple-500"
                          : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1" />

            <button
              onClick={() => setIsReceiveProduceOpen(true)}
              className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-3 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span className="hidden sm:inline">รับเข้าผลิต</span>
            </button>
            <button
              onClick={() => setRecipeModalOpen(true)}
              className="bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 px-3 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">สูตรการผลิต</span>
            </button>
            <button
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-3 py-2.5 rounded-2xl text-xs md:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">เพิ่มสินค้าใหม่</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">รูปภาพ</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">รหัสสินค้า</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">ชื่อสินค้า</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">สต็อกรวม</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                        <Search className="w-10 h-10 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-lg">ไม่พบสินค้า</p>
                        <p className="text-gray-400 font-medium mt-1">ไม่มีสินค้าที่ตรงกับเงื่อนไขการค้นหา</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map(item => (
                  <tr key={item.Pid} className="hover:bg-indigo-50/20 transition-colors group">
                    <td className="px-4 py-2">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mx-auto">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No</div>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="font-bold text-gray-500 text-xs">{item.productCode}</span>
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-extrabold text-gray-800 text-sm">{item.name}</p>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-xl font-black border whitespace-nowrap ${item.stock === 0
                        ? "text-rose-600 bg-rose-50 border-rose-200"
                        : item.stock <= 5
                          ? "text-orange-600 bg-orange-50 border-orange-200"
                          : "text-indigo-700 bg-indigo-50 border-indigo-200"
                        }`}>
                        {item.stock} ชิ้น
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center">
                        <ActionMenu
                          canAdjustStock={canAdjustStock}
                          onAdjust={() => { setAdjustProductId(item.Pid); setAdjustStockOpen(true) }}
                          onDispatch={() => { setDispatchProductId(item.Pid); setDispatchProductName(item.name); setDispatchOpen(true) }}
                          onLot={() => { setSelectedLotProductCode(item.productCode); setSelectedLotProductId(item.Pid); setSelectedLotProductName(item.name); setLotModalOpen(true) }}
                          onEdit={() => { setEditProductId(item.Pid); setEditModalOpen(true) }}
                          onSlip={() => { setSelectedSlipId(item.Pid); setSelectedSlipName(item.name); setSlipModalOpen(true) }}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAndSorted.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center rounded-b-3xl">
            <span className="text-sm font-medium text-gray-500">
              แสดงผล <strong className="text-gray-900">{filteredAndSorted.length}</strong> จาก <strong className="text-gray-900">{data.length}</strong> รายการ
            </span>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddProductModal open={open} onClose={() => setOpen(false)} onSuccess={() => router.refresh()} />
      <ProductSlipModal open={slipModalOpen} productId={selectedSlipId} productName={selectedSlipName} onClose={() => setSlipModalOpen(false)} />
      <EditProductModal open={editModalOpen} productId={editProductId} onClose={() => { setEditModalOpen(false); setEditProductId(null) }} onSuccess={() => router.refresh()} />
      <ProductRecipeModal open={recipeModalOpen} onClose={() => setRecipeModalOpen(false)} />
      <AdjustStockModal open={adjustStockOpen} productId={adjustProductId} onClose={() => { setAdjustStockOpen(false); setAdjustProductId(null) }} onSuccess={() => router.refresh()} />
      <ReceiveProduceModal open={isReceiveProduceOpen} onSuccess={() => router.refresh()} onClose={() => setIsReceiveProduceOpen(false)} />
      <ProductLotModal open={lotModalOpen} productCode={selectedLotProductCode} productId={selectedLotProductId} productName={selectedLotProductName} unit="ชิ้น" onClose={() => { setLotModalOpen(false); setSelectedLotProductId(null) }} />
      {dispatchOpen && dispatchProductId && (
        <DispatchProductModal open={dispatchOpen} productId={dispatchProductId} productName={dispatchProductName} onClose={() => { setDispatchOpen(false); setDispatchProductId(null) }} onSuccess={() => router.refresh()} />
      )}
    </div>
  )
}