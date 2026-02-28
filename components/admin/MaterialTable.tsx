"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  X,
  Hammer,
  ChevronDown,
  Layers,
  FileText,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import MaterialHistoryModal from "./MaterialHistoryModal"

type Material = {
  id: number
  code: string | null
  name: string
  stock: number
  unit: string
  costPerUnit: number | null
}

type ProductOption = {
  id: number
  productId: number
  name: string
  hasRecipe: boolean
}

const SORT_OPTIONS = [
  { value: "newest", label: "เพิ่มล่าสุด" },
  { value: "oldest", label: "เก่าสุด" },
  { value: "name-az", label: "ชื่อวัตถุดิบ (A-Z)" },
  { value: "name-za", label: "ชื่อวัตถุดิบ (Z-A)" },
  { value: "stock-high", label: "สต็อก (มากไปน้อย)" },
  { value: "stock-low", label: "สต็อก (น้อยไปมาก)" },
] as const

type SortValue = typeof SORT_OPTIONS[number]["value"]

export default function MaterialTable({ initialMaterials }: { initialMaterials: Material[] }) {
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)
  const [selectedHistoryName, setSelectedHistoryName] = useState("")

  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [search, setSearch] = useState("")

  const [sort, setSort] = useState<SortValue>("newest")
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newMat, setNewMat] = useState({ code: "", name: "", unit: "กรัม" })

  const [txModal, setTxModal] = useState<{ isOpen: boolean; mat: Material | null; type: "IN" | "OUT" }>({
    isOpen: false, mat: null, type: "IN"
  })
  const [txForm, setTxForm] = useState({ amount: "", note: "", totalCost: "" })
  const [isLoading, setIsLoading] = useState(false)

  const [isProduceOpen, setIsProduceOpen] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])

  const [produceForm, setProduceForm] = useState({ variantId: "", amount: "", note: "" })

  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isAddOpen) {
      const maxId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) : 0

      const autoCode = `MAT-${String(maxId + 1).padStart(4, '0')}`

      setNewMat({ code: autoCode, name: "", unit: "กรัม" })
    }
  }, [isAddOpen, materials])

  useEffect(() => {
    if (isProduceOpen && products.length === 0) {
      fetch("/api/products")
        .then(res => res.json())
        .then(data => setProducts(data))
        .catch(err => console.error("โหลดสินค้าล้มเหลว", err))
    }
  }, [isProduceOpen, products.length])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false)
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredAndSorted = useMemo(() => {
    let result = [...materials]

    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
    )

    switch (sort) {
      case "stock-high": result.sort((a, b) => b.stock - a.stock); break
      case "stock-low": result.sort((a, b) => a.stock - b.stock); break
      case "name-az": result.sort((a, b) => a.name.localeCompare(b.name)); break
      case "name-za": result.sort((a, b) => b.name.localeCompare(a.name)); break
      case "oldest": result.reverse(); break
    }

    return result
  }, [materials, search, sort])

  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.value === sort)?.label

  const handleAddMaterial = async () => {
    if (!newMat.name || !newMat.unit) return toast.error("กรุณากรอกชื่อและหน่วยนับ")

    setIsLoading(true)
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMat),
      })
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ")
      const savedMat = await res.json()

      setMaterials([savedMat, ...materials])
      setIsAddOpen(false)
      toast.success("เพิ่มวัตถุดิบเรียบร้อย")
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มวัตถุดิบ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransaction = async () => {
    const amountVal = Number(txForm.amount)
    if (amountVal <= 0) return toast.error("กรุณาระบุจำนวนให้ถูกต้อง")
    if (txModal.type === "OUT" && txModal.mat && amountVal > txModal.mat.stock) {
      return toast.error("จำนวนเบิกออก มากกว่าสต๊อกที่มีอยู่!")
    }
    if (txModal.type === "IN") {
      if (!txForm.totalCost || Number(txForm.totalCost) <= 0) {
        return toast.error("กรุณากรอกราคารวมล๊อตนี้")
      }
    }


    setIsLoading(true)
    try {
      const res = await fetch("/api/materials/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: txModal.mat?.id,
          type: txModal.type,
          amount: amountVal,
          totalCost: txForm.totalCost ? Number(txForm.totalCost) : null,
          note: txForm.note,
        }),
      })

      if (!res.ok) throw new Error("อัปเดตสต๊อกไม่สำเร็จ")

      const responseData = await res.json()
      const actualUpdatedMat = responseData.data.updatedMaterial

      setMaterials(materials.map(m => m.id === actualUpdatedMat.id ? actualUpdatedMat : m))

      setTxModal({ isOpen: false, mat: null, type: "IN" })
      setTxForm({ amount: "", note: "", totalCost: "" })
      toast.success(`บันทึก${txModal.type === "IN" ? "รับเข้า" : "เบิกออก"}เรียบร้อย`)
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProduce = async () => {
    const amountVal = Number(produceForm.amount)
    if (!produceForm.variantId) return toast.error("กรุณาเลือกสินค้าที่จะผลิต")
    if (amountVal <= 0) return toast.error("กรุณาระบุจำนวนผลิตให้ถูกต้อง")

    setIsLoading(true)
    try {
      const res = await fetch("/api/materials/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: Number(produceForm.variantId),
          produceAmount: amountVal,
          note: produceForm.note
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "ผลิตสินค้าไม่สำเร็จ วัตถุดิบอาจไม่เพียงพอ")
      }

      const updatedMaterials = await res.json()

      setMaterials(updatedMaterials)
      setIsProduceOpen(false)
      setProduceForm({ variantId: "", amount: "", note: "" })
      toast.success("เบิกวัตถุดิบเพื่อผลิตสินค้าเรียบร้อย สต๊อกสินค้าเพิ่มขึ้นแล้ว!")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedProduct = products.find(p => p.id.toString() === produceForm.variantId)
  const selectedProductLabel = selectedProduct ? selectedProduct.name : "-- กรุณาเลือกสินค้า --"

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-7 h-7 text-purple-600" />
            Materials Inventory
          </h1>
          <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลวัตถุดิบ การเบิกใช้ และตรวจสอบจำนวนคงเหลือ</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

        <div className="relative z-10 p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อวัตถุดิบ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm transition-all"
              />
            </div>

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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${sort === option.value
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
              onClick={() => setIsProduceOpen(true)}
              className="flex-1 sm:flex-none bg-orange-50 border border-orange-300 text-orange-700 hover:bg-orange-100 hover:border-orange-300 hover:text-orange-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Hammer className="w-4 h-4" /> เบิกผลิตสินค้า
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> เพิ่มวัตถุดิบ
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">รหัส</th>
                <th className="px-6 py-4">ชื่อวัตถุดิบ</th>
                <th className="px-6 py-4 text-center">คงเหลือ</th>
                <th className="px-6 py-4">หน่วย</th>
                <th className="px-6 py-4">ต้นทุน/หน่วย</th>
                <th className="px-6 py-4 text-right">จัดการสต๊อก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSorted.map((mat) => (
                <tr key={mat.id} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">{mat.code || "-"}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">{mat.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold text-xs border ${mat.stock > 10
                      ? 'text-green-700 bg-green-50 border-green-100' :
                      mat.stock > 0
                        ? 'text-orange-700 bg-orange-50 border-orange-100'
                        : 'text-red-600 bg-red-50 border-red-100'
                      }`}>
                      {mat.stock.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{mat.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">฿{(mat.costPerUnit ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setTxModal({ isOpen: true, mat, type: "IN" })}
                        className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        title="รับเข้าสต๊อกแบบแมนนวล"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" /> รับเข้า
                      </button>
                      <button
                        onClick={() => setTxModal({ isOpen: true, mat, type: "OUT" })}
                        className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowUpFromLine className="w-3.5 h-3.5" /> เบิกออก
                      </button>
                      <button
                        onClick={() => {
                          setSelectedHistoryId(mat.id)
                          setSelectedHistoryName(mat.name)
                          setHistoryModalOpen(true)
                        }}
                        className="bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> ประวัติ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400 bg-gray-50/50">
                    <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    ไม่พบข้อมูลวัตถุดิบที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL เพิ่มวัตถุดิบ ================= */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3 text-purple-700">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                  <Plus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-extrabold text-gray-800">เพิ่มวัตถุดิบใหม่</h2>
              </div>
              <button 
                onClick={() => setIsAddOpen(false)} 
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700">รหัสวัตถุดิบ</label>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1 tracking-wider uppercase">
                    <Sparkles className="w-3 h-3" /> Auto
                  </span>
                </div>
                <input
                  type="text"
                  value={newMat.code}
                  disabled
                  placeholder="ระบบจะสร้างให้เมื่อบันทึก"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50 text-gray-500 font-bold cursor-not-allowed pointer-events-none select-none shadow-inner"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ชื่อวัตถุดิบ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMat.name}
                  onChange={e => setNewMat({ ...newMat, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-purple-300"
                  placeholder="เช่น แป้งสาลี, น้ำตาลทราย, เมล็ดกาแฟ"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  หน่วยนับ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMat.unit}
                  onChange={e => setNewMat({ ...newMat, unit: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-purple-300"
                  placeholder="เช่น กรัม, กิโลกรัม, ซอง, ลิตร"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "บันทึกข้อมูล"
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      
      {/* ================= MODAL รับเข้า/เบิกออก ================= */}
      {txModal.isOpen && txModal.mat && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center ${txModal.type === "IN" ? "bg-green-50/50" : "bg-red-50/50"}`}>
              <div className={`flex items-center gap-2 ${txModal.type === "IN" ? "text-green-700" : "text-red-700"}`}>
                {txModal.type === "IN" ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                <h2 className="text-lg font-bold">
                  {txModal.type === "IN" ? "รับเข้าวัตถุดิบ" : "เบิกออกวัตถุดิบ"}
                </h2>
              </div>
              <button onClick={() => setTxModal({ isOpen: false, mat: null, type: "IN" })} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-xl flex justify-between items-center">
                <span className="font-bold text-gray-900">{txModal.mat.name}</span>
                <span className="text-sm font-medium px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600">
                  คงเหลือ: {txModal.mat.stock} {txModal.mat.unit}
                </span>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">จำนวน ({txModal.mat.unit}) *</label>
                <input
                  type="number"
                  value={txForm.amount}
                  onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                  placeholder="เช่น 10, 50"
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:bg-white bg-gray-50 transition-all font-medium ${txModal.type === "IN" ? "focus:ring-green-500" : "focus:ring-red-500"}`}
                />
              </div>

              {txModal.type === "IN" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ราคารวมล๊อตนี้ (฿)</label>
                  <input
                    type="number"
                    value={txForm.totalCost}
                    onChange={e => setTxForm({ ...txForm, totalCost: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 focus:bg-white bg-gray-50 transition-all font-medium"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  value={txForm.note}
                  onChange={e => setTxForm({ ...txForm, note: e.target.value })}
                  className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:bg-white bg-gray-50 transition-all font-medium ${txModal.type === "IN" ? "focus:ring-green-500" : "focus:ring-red-500"}`}
                  placeholder={txModal.type === "IN" ? "เช่น ซื้อจากร้าน A" : "เช่น ของเสียชำรุด"}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setTxModal({ isOpen: false, mat: null, type: "IN" })}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleTransaction}
                  disabled={isLoading}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${txModal.type === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : `ยืนยัน${txModal.type === "IN" ? "รับเข้า" : "เบิกออก"}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL เบิกเพื่อผลิตสินค้า ================= */}
      {isProduceOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
              <div className="flex items-center gap-2 text-orange-600">
                <Hammer className="w-5 h-5" />
                <h2 className="text-lg font-bold">เบิกผลิตสินค้า</h2>
              </div>
              <button onClick={() => setIsProduceOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-orange-50/80 border border-orange-100 p-3.5 rounded-xl text-sm text-orange-800 leading-relaxed font-medium">
                ระบบจะทำการเบิกวัตถุดิบออกตาม <b className="text-orange-900">"สูตร"</b> ของสินค้าที่เลือก และเพิ่มจำนวนเข้าไปใน <b className="text-orange-900">"สต๊อกสินค้าสำเร็จรูป"</b> อัตโนมัติ
              </div>

              {/* Custom Dropdown สำหรับเลือกสินค้า */}
              <div className="space-y-2" ref={productDropdownRef}>
                <label className="block text-sm font-bold text-gray-700">เลือกสินค้าที่จะผลิต *</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                    className={`w-full flex items-center justify-between border ${isProductDropdownOpen ? 'ring-2 ring-orange-500' : 'border-gray-200 hover:border-orange-300'
                      } rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-all cursor-pointer text-left`}
                  >
                    <span className={produceForm.variantId ? "text-gray-800 font-bold" : "text-gray-400 font-medium truncate"}>
                      {selectedProductLabel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${isProductDropdownOpen ? 'rotate-180 text-orange-500' : ''}`} />
                  </button>

                  {isProductDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1.5">
                        {products.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">ไม่มีข้อมูลสินค้า</div>
                        ) : (
                          products.map(p => {
                            const isSelected = produceForm.variantId === p.id.toString()
                            const isDisabled = !p.hasRecipe || p.id === -1

                            return (
                              <button
                                key={`${p.productId}-${p.id}`}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => {
                                  setProduceForm({ ...produceForm, variantId: p.id.toString() })
                                  setIsProductDropdownOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex justify-between items-center ${isSelected
                                  ? "bg-orange-50 text-orange-700 font-bold border-l-4 border-orange-500"
                                  : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                                  } ${isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
                              >
                                <span>{p.name}</span>
                                {isDisabled && (
                                  <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold ml-2">
                                    ไม่มีสูตร
                                  </span>
                                )}
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
                <label className="block text-sm font-bold text-gray-700 mb-2">จำนวนสินค้าที่จะผลิต (ชิ้น) *</label>
                <input
                  type="number"
                  min="1"
                  value={produceForm.amount}
                  onChange={e => setProduceForm({ ...produceForm, amount: e.target.value })}
                  placeholder="เช่น 1, 5, 10"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white bg-gray-50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  value={produceForm.note}
                  onChange={e => setProduceForm({ ...produceForm, note: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white bg-gray-50 transition-all font-medium"
                  placeholder="เช่น ผลิตล๊อตที่ 1"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProduceOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleProduce}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "ยืนยันการผลิต"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MaterialHistoryModal
        open={historyModalOpen}
        materialId={selectedHistoryId}
        materialName={selectedHistoryName}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  )
}