"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown, PackagePlus, FileText, Edit, Plus, BookOpen, PackageSearch, X, ArrowDownToLine } from "lucide-react"
import { toast } from "sonner"

import AddProductModal from "./AddProductModal"
import EditProductModal from "./EditProductModal"
import ProductSlipModal from "./ProductSlipModal"
import ProductRecipeModal from "../ProductRecipeModal"

type StockItem = {
  Pid: number
  productCode: string
  name: string
  stock: number
  imageUrl?: string
}

const SORT_OPTIONS = [
  { value: "newest", label: "เพิ่มล่าสุด" },
  { value: "oldest", label: "เก่าสุด" },
  { value: "stock-high", label: "สต็อก (มากไปน้อย)" },
  { value: "stock-low", label: "สต็อก (น้อยไปมาก)" },
  { value: "name-az", label: "ชื่อ (A-Z)" },
  { value: "name-za", label: "ชื่อ (Z-A)" },
] as const

export default function StockTable({ data }: { data: StockItem[] }) {
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest" | "stock-high" | "stock-low" | "name-az" | "name-za">("newest")
  
  const [open, setOpen] = useState(false)
  const [recipeModalOpen, setRecipeModalOpen] = useState(false)
  
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState<number | null>(null)

  const [slipModalOpen, setSlipModalOpen] = useState(false)
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null)
  const [selectedSlipName, setSelectedSlipName] = useState("")

  const [adjustStockOpen, setAdjustStockOpen] = useState(false)
  const [adjustProductId, setAdjustProductId] = useState<number | null>(null)

  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredAndSorted = useMemo(() => {
    let result = [...data]

    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.productCode.toLowerCase().includes(search.toLowerCase())
    )

    switch (sort) {
      case "stock-high": result.sort((a, b) => b.stock - a.stock); break
      case "stock-low": result.sort((a, b) => a.stock - b.stock); break
      case "name-az": result.sort((a, b) => a.name.localeCompare(b.name)); break
      case "name-za": result.sort((a, b) => b.name.localeCompare(a.name)); break
      case "oldest": result.reverse(); break
    }

    return result
  }, [data, search, sort])

  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.value === sort)?.label

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <PackageSearch className="w-7 h-7 text-purple-600" />
            Product Inventory
          </h1>
          <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลสินค้า สูตรการผลิต และตรวจสอบจำนวนคงเหลือ</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

        {/* ================= TOP BAR (Search & Actions) ================= */}
        <div className="relative z-10 p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อสินค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm transition-all"
              />
            </div>

            {/* Custom Sort Dropdown */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between min-w-[160px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm cursor-pointer"
              >
                <span className="text-gray-700 font-medium">{currentSortLabel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-purple-500' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1.5">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSort(option.value as any)
                          setIsSortOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                          sort === option.value
                            ? "bg-purple-50 text-purple-700 font-bold border-l-4 border-purple-500"
                            : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setRecipeModalOpen(true)}
              className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-purple-300 hover:text-purple-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> สูตรการผลิต
            </button>
            <button
              onClick={() => setOpen(true)}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">รูปภาพ</th>
                <th className="px-6 py-4">รหัสสินค้า</th>
                <th className="px-6 py-4">ชื่อสินค้า</th>
                <th className="px-6 py-4 text-center">จำนวนสต็อกรวม</th>
                <th className="px-6 py-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSorted.map((item) => (
                <tr key={item.Pid} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow transition-all">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{item.productCode}</td>
                  <td className="px-6 py-4 font-bold text-gray-900 text-base">{item.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-sm border ${
                      item.stock <= 5 
                        ? 'text-red-600 bg-red-50 border-red-100' 
                        : 'text-purple-700 bg-purple-50 border-purple-100'
                    }`}>
                      {item.stock} ชิ้น
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* ปุ่มเพิ่มสต๊อก (ใหม่) */}
                      <button
                        onClick={() => { setAdjustProductId(item.Pid); setAdjustStockOpen(true) }}
                        className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        title="รับเข้าสต๊อกแบบแมนนวล"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" /> เพิ่มจำนวน
                      </button>

                      {/* ปุ่ม Edit */}
                      <button
                        onClick={() => { setEditProductId(item.Pid); setEditModalOpen(true) }}
                        className="bg-white text-gray-700 hover:text-purple-700 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> รายละเอียด
                      </button>

                      {/* ปุ่ม History */}
                      <button
                        onClick={() => {
                          setSelectedSlipId(item.Pid)
                          setSelectedSlipName(item.name)
                          setSlipModalOpen(true)
                        }}
                        className="bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> ประวัติ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 bg-gray-50/50">
                    <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    ไม่พบข้อมูลสินค้าที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- Modals --- */}
        <AddProductModal
          open={open}
          onClose={() => setOpen(false)}
          onSuccess={() => router.refresh()}
        />

        <ProductSlipModal
          open={slipModalOpen}
          productId={selectedSlipId}
          productName={selectedSlipName}
          onClose={() => setSlipModalOpen(false)}
        />

        <EditProductModal
          open={editModalOpen}
          productId={editProductId}
          onClose={() => { setEditModalOpen(false); setEditProductId(null) }}
          onSuccess={() => router.refresh()}
        />

        <ProductRecipeModal
          open={recipeModalOpen}
          onClose={() => setRecipeModalOpen(false)}
        />

        {/* 🌟 เรียกใช้ Modal เพิ่มจำนวนสต๊อก (แนบอยู่ด้านล่างไฟล์นี้) */}
        <AdjustStockModal 
          open={adjustStockOpen}
          productId={adjustProductId}
          onClose={() => { setAdjustStockOpen(false); setAdjustProductId(null) }}
          onSuccess={() => router.refresh()}
        />
      </div>
    </div>
  )
}

function AdjustStockModal({ open, productId, onClose, onSuccess }: { open: boolean, productId: number | null, onClose: () => void, onSuccess: () => void }) {
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  // 👈 เพิ่ม State และ Ref สำหรับ Custom Dropdown
  const [isVariantOpen, setIsVariantOpen] = useState(false)
  const variantRef = useRef<HTMLDivElement>(null)

  // ดึงข้อมูล
  useEffect(() => {
    if (open && productId) {
      setIsFetching(true)
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          if (data.variants) setVariants(data.variants)
          if (data.variants?.length === 1) setSelectedVariantId(data.variants[0].id.toString())
        })
        .finally(() => setIsFetching(false))
    } else {
      setVariants([]); setSelectedVariantId(""); setAmount(""); setNote(""); setIsVariantOpen(false)
    }
  }, [open, productId])

  // ปิด Dropdown เมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variantRef.current && !variantRef.current.contains(event.target as Node)) {
        setIsVariantOpen(false)
      }
    }
    if (isVariantOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isVariantOpen])

  const handleSave = async () => {
    if (!selectedVariantId) return toast.error("กรุณาเลือกตัวเลือกสินค้า")
    if (!amount || Number(amount) <= 0) return toast.error("กรุณาระบุจำนวนให้ถูกต้อง")

    setIsLoading(true)
    try {
      const res = await fetch("/api/products/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: Number(selectedVariantId),
          amount: Number(amount),
          type: "IN",
          note: note || "เพิ่มสต๊อกแมนนวล"
        })
      })

      if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการปรับสต๊อก")

      toast.success("เพิ่มสต๊อกเรียบร้อยแล้ว")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 👈 หาชื่อที่เลือกมาแสดงบนปุ่ม
  const selectedVariant = variants.find(v => v.id.toString() === selectedVariantId)
  const selectedLabel = selectedVariant 
    ? `${selectedVariant.values?.map((val: any) => val.optionValue.value).join(" / ") || "ค่าเริ่มต้น"} (คงเหลือ: ${selectedVariant.stock})`
    : "-- กรุณาเลือกตัวเลือกสินค้า --"

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
          <div className="flex items-center gap-2 text-green-700">
            <ArrowDownToLine className="w-5 h-5" />
            <h2 className="text-lg font-bold">เพิ่มจำนวนสินค้า (รับเข้า)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isFetching ? (
            <div className="text-center py-8 text-gray-400 font-medium">กำลังโหลดข้อมูลสินค้า...</div>
          ) : (
            <>
              {/* 🌟 1. Custom Dropdown สำหรับเลือก Variant */}
              <div className="space-y-2" ref={variantRef}>
                <label className="block text-sm font-bold text-gray-700">เลือกตัวเลือก (Variant)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsVariantOpen(!isVariantOpen)}
                    className={`w-full flex items-center justify-between border ${
                      isVariantOpen ? 'ring-2 ring-green-500' : 'border-gray-200 hover:border-green-300'
                    } rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-all cursor-pointer text-left`}
                  >
                    <span className={selectedVariantId ? "text-gray-800 font-bold" : "text-gray-400 font-medium"}>
                      {selectedLabel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isVariantOpen ? 'rotate-180 text-green-500' : ''}`} />
                  </button>

                  {/* เมนูที่เด้งลงมา */}
                  {isVariantOpen && (
                    <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1.5">
                        {variants.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">ไม่มีตัวเลือกสินค้า</div>
                        ) : (
                          variants.map((v: any) => {
                            const optionName = v.values?.map((val: any) => val.optionValue.value).join(" / ") || "ค่าเริ่มต้น (ไม่มีตัวเลือก)"
                            const isSelected = selectedVariantId === v.id.toString()
                            
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  setSelectedVariantId(v.id.toString())
                                  setIsVariantOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${
                                  isSelected
                                    ? "bg-green-50 text-green-700 font-bold border-l-4 border-green-500"
                                    : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                                }`}
                              >
                                <span>{optionName}</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                                  isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  เหลือ {v.stock}
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">จำนวนที่ต้องการเพิ่ม (ชิ้น)</label>
                <input 
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="เช่น 10, 50"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:bg-white bg-gray-50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น สินค้ารับคืน, สินค้าแถม..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:bg-white bg-gray-50 transition-all font-medium"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? "กำลังบันทึก..." : "ยืนยันรับเข้าสต๊อก"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}