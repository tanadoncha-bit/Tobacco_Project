"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Hammer,
  ChevronDown,
  Layers,
  FileText,
  Package,
} from "lucide-react"
import { toast } from "sonner"
import MaterialHistoryModal from "./MaterialHistoryModal"
import AddMaterialModal from "./AddMaterialModal"
import TransactionModal from "./TransactionModal"
import ProduceModal from "./ProduceModal"
import LotsModal from "./LotsModal"

type MaterialLot = {
  id: number
  lotNumber: string
  stock: number
  costPerUnit: number | null
  receiveDate: Date | string
  expireDate: Date | string | null
}

type Material = {
  id: number
  code: string | null
  name: string
  stock: number
  unit: string
  costPerUnit: number | null
  MaterialLot?: MaterialLot[]
}

type ProductOption = {
  id: number
  productId: number
  name: string
  hasRecipe: boolean
}

type TransactionForm = {
  amount: string
  note: string
  totalCost: string
  materialLotId: string
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
  // ─── Core state ───────────────────────────────────────────────────────────
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortValue>("newest")
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  // ─── Add modal ────────────────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newMat, setNewMat] = useState({ code: "", name: "", unit: "กรัม" })

  // ─── Transaction modal ────────────────────────────────────────────────────
  const [txModal, setTxModal] = useState<{ isOpen: boolean; mat: Material | null; type: "IN" | "OUT" }>({
    isOpen: false, mat: null, type: "IN",
  })
  const [txForm, setTxForm] = useState<TransactionForm>({ amount: "", note: "", totalCost: "", materialLotId: "" })
  const [lotNumber, setLotNumber] = useState("")
  const [expireDate, setExpireDate] = useState("")
  const [noExpire, setNoExpire] = useState(true)

  // ─── Produce modal ────────────────────────────────────────────────────────
  const [isProduceOpen, setIsProduceOpen] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [produceForm, setProduceForm] = useState({ variantId: "", amount: "", note: "" })
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  // ─── Lots modal ───────────────────────────────────────────────────────────
  const [lotsModal, setLotsModal] = useState<{ isOpen: boolean; mat: Material | null }>({
    isOpen: false, mat: null,
  })

  // ─── History modal ────────────────────────────────────────────────────────
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)
  const [selectedHistoryName, setSelectedHistoryName] = useState("")

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (txModal.isOpen) {
      setTxForm({ amount: "", totalCost: "", note: "", materialLotId: "" })
      setLotNumber("")
      setExpireDate("")
      setNoExpire(false)
    }
  }, [txModal.isOpen, txModal.mat])

  useEffect(() => {
    if (isAddOpen) {
      const maxId = materials.length > 0 ? Math.max(...materials.map(m => m.id)) : 0
      setNewMat({ code: `MAT-${String(maxId + 1).padStart(4, "0")}`, name: "", unit: "กรัม" })
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

  // ─── Derived state ────────────────────────────────────────────────────────
  const filteredAndSorted = useMemo(() => {
    let result = [...materials].filter(
      item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
    )
    switch (sort) {
      case "stock-high": result.sort((a, b) => b.stock - a.stock); break
      case "stock-low":  result.sort((a, b) => a.stock - b.stock); break
      case "name-az":    result.sort((a, b) => a.name.localeCompare(b.name)); break
      case "name-za":    result.sort((a, b) => b.name.localeCompare(a.name)); break
      case "oldest":     result.reverse(); break
    }
    return result
  }, [materials, search, sort])

  const currentSortLabel = SORT_OPTIONS.find(opt => opt.value === sort)?.label

  // ─── Handlers ─────────────────────────────────────────────────────────────
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
    } catch {
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
    if (txModal.type === "IN" && (!txForm.totalCost || Number(txForm.totalCost) <= 0)) {
      return toast.error("กรุณากรอกราคารวมล๊อตนี้")
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
          lotNumber: txModal.type === "IN" ? lotNumber || undefined : undefined,
          expireDate: txModal.type === "IN" && expireDate ? new Date(expireDate).toISOString() : null,
          materialLotId: txModal.type === "OUT" && txForm.materialLotId ? Number(txForm.materialLotId) : null,
        }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "อัปเดตสต๊อกไม่สำเร็จ")
      }
      const refreshRes = await fetch("/api/materials")
      if (refreshRes.ok) {
        const freshMaterials = await refreshRes.json()
        setMaterials(freshMaterials.data || freshMaterials)
      }
      setTxModal({ isOpen: false, mat: null, type: "IN" })
      setTxForm({ amount: "", note: "", totalCost: "", materialLotId: "" })
      setLotNumber("")
      setExpireDate("")
      toast.success(`บันทึก${txModal.type === "IN" ? "รับเข้า" : "เบิกออก"}เรียบร้อย`)
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด")
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
        body: JSON.stringify({ variantId: Number(produceForm.variantId), produceAmount: amountVal, note: produceForm.note }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "ผลิตสินค้าไม่สำเร็จ วัตถุดิบอาจไม่เพียงพอ")
      }
      const updatedMaterials = await res.json()
      setMaterials(updatedMaterials)
      setIsProduceOpen(false)
      setProduceForm({ variantId: "", amount: "", note: "" })
      toast.success("เบิกวัตถุดิบเพื่อผลิตสินค้าเสร็จสิ้น")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
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

        {/* Toolbar */}
        <div className="relative z-10 p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อวัตถุดิบ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm transition-all"
              />
            </div>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between min-w-[160px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm cursor-pointer"
              >
                <span className="text-gray-700 font-medium">{currentSortLabel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform duration-200 ${isSortOpen ? "rotate-180 text-purple-500" : ""}`} />
              </button>
              {isSortOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1.5">
                    {SORT_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => { setSort(option.value as SortValue); setIsSortOpen(false) }}
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
              onClick={() => setIsProduceOpen(true)}
              className="flex-1 sm:flex-none bg-orange-50 border border-orange-300 text-orange-700 hover:bg-orange-100 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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

        {/* Table */}
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
              {filteredAndSorted.map(mat => (
                <tr key={mat.id} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">{mat.code || "-"}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">{mat.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-bold text-xs border ${
                      mat.stock > 10
                        ? "text-green-700 bg-green-50 border-green-100"
                        : mat.stock > 0
                        ? "text-orange-700 bg-orange-50 border-orange-100"
                        : "text-red-600 bg-red-50 border-red-100"
                    }`}>
                      {(mat.stock ?? 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{mat.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">฿{(mat.costPerUnit ?? 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setTxModal({ isOpen: true, mat, type: "IN" })}
                        className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
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
                        onClick={() => setLotsModal({ isOpen: true, mat })}
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" /> ล๊อต
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

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}
      <AddMaterialModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        newMat={newMat}
        setNewMat={setNewMat}
        onSubmit={handleAddMaterial}
        isLoading={isLoading}
      />

      <TransactionModal
        isOpen={txModal.isOpen}
        mat={txModal.mat}
        type={txModal.type}
        onClose={() => {
          setTxModal({ isOpen: false, mat: null, type: "IN" })
          setTxForm({ amount: "", totalCost: "", note: "", materialLotId: "" })
        }}
        txForm={txForm}
        setTxForm={setTxForm}
        lotNumber={lotNumber}
        setLotNumber={setLotNumber}
        expireDate={expireDate}
        setExpireDate={setExpireDate}
        noExpire={noExpire}
        setNoExpire={setNoExpire}
        onSubmit={handleTransaction}
        isLoading={isLoading}
        currentStock={materials.find(m => m.id === txModal.mat?.id)?.stock ?? txModal.mat?.stock ?? 0}
        currentLots={materials.find(m => m.id === txModal.mat?.id)?.MaterialLot ?? []}
      />

      <ProduceModal
        isOpen={isProduceOpen}
        onClose={() => setIsProduceOpen(false)}
        products={products}
        produceForm={produceForm}
        setProduceForm={setProduceForm}
        isProductDropdownOpen={isProductDropdownOpen}
        setIsProductDropdownOpen={setIsProductDropdownOpen}
        productDropdownRef={productDropdownRef}
        onSubmit={handleProduce}
        isLoading={isLoading}
      />

      <LotsModal
        isOpen={lotsModal.isOpen}
        mat={lotsModal.mat}
        onClose={() => setLotsModal({ isOpen: false, mat: null })}
      />

      <MaterialHistoryModal
        open={historyModalOpen}
        materialId={selectedHistoryId}
        materialName={selectedHistoryName}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  )
}