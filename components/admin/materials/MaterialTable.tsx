"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  Plus, ArrowDownToLine, ArrowUpFromLine, Search, Hammer,
  ChevronDown, Layers, FileText, AlertTriangle, FlaskConical,
  PackageX, Timer,
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
  totalStock: number
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

type Stats = {
  totalMaterials: number
  outOfStock: number
  lowStock: number
  nearExpiry: number
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

function ActionMenu({ onIn, onOut, onLot, onHistory }: {
  onIn: () => void
  onOut: () => void
  onLot: () => void
  onHistory: () => void
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
        <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          <button onClick={() => { onIn(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer">
            <ArrowDownToLine className="w-3.5 h-3.5" /> รับเข้า
          </button>
          <button onClick={() => { onOut(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 cursor-pointer">
            <ArrowUpFromLine className="w-3.5 h-3.5" /> เบิกออก
          </button>
          <button onClick={() => { onLot(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-50 cursor-pointer">
            <Layers className="w-3.5 h-3.5" /> ล็อต
          </button>
          <button onClick={() => { onHistory(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 cursor-pointer">
            <FileText className="w-3.5 h-3.5" /> ประวัติ
          </button>
        </div>
      )}
    </div>
  )
}

export default function MaterialTable({
  initialMaterials,
  stats,
}: {
  initialMaterials: Material[]
  stats: Stats
}) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortValue>("newest")
  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newMat, setNewMat] = useState({ code: "", name: "", unit: "กรัม" })

  const [txModal, setTxModal] = useState<{ isOpen: boolean; mat: Material | null; type: "IN" | "OUT" }>({
    isOpen: false, mat: null, type: "IN",
  })
  const [txForm, setTxForm] = useState<TransactionForm>({ amount: "", note: "", totalCost: "", materialLotId: "" })
  const [lotNumber, setLotNumber] = useState("")
  const [expireDate, setExpireDate] = useState("")
  const [noExpire, setNoExpire] = useState(true)

  const [isProduceOpen, setIsProduceOpen] = useState(false)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [produceForm, setProduceForm] = useState({ variantId: "", amount: "", note: "" })
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const productDropdownRef = useRef<HTMLDivElement>(null)

  const [lotsModal, setLotsModal] = useState<{ isOpen: boolean; mat: Material | null }>({ isOpen: false, mat: null })
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)
  const [selectedHistoryName, setSelectedHistoryName] = useState("")

  useEffect(() => {
    if (txModal.isOpen) {
      setTxForm({ amount: "", totalCost: "", note: "", materialLotId: "" })
      setLotNumber(""); setExpireDate(""); setNoExpire(false)
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
      fetch("/api/products").then(r => r.json()).then(setProducts).catch(console.error)
    }
  }, [isProduceOpen, products.length])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node))
        setIsProductDropdownOpen(false)
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setIsSortOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filteredAndSorted = useMemo(() => {
    let result = [...materials].filter(
      m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.code && m.code.toLowerCase().includes(search.toLowerCase()))
    )
    switch (sort) {
      case "stock-high": result.sort((a, b) => b.totalStock - a.totalStock); break
      case "stock-low": result.sort((a, b) => a.totalStock - b.totalStock); break
      case "name-az": result.sort((a, b) => a.name.localeCompare(b.name)); break
      case "name-za": result.sort((a, b) => b.name.localeCompare(a.name)); break
      case "oldest": result.reverse(); break
    }
    return result
  }, [materials, search, sort])

  const refreshMaterials = async () => {
    const refreshRes = await fetch("/api/materials")
    if (!refreshRes.ok) return
    const fresh = await refreshRes.json()
    const freshList: Material[] = (fresh.data || fresh).map((m: any) => ({
      ...m,
      totalStock: m.MaterialLot?.reduce((sum: number, lot: MaterialLot) => sum + lot.stock, 0) ?? 0,
    }))
    setMaterials(freshList)
    return freshList
  }

  const handleAddMaterial = async () => {
    if (!newMat.name || !newMat.unit) return toast.error("กรุณากรอกชื่อและหน่วยนับ")
    setIsLoading(true)
    try {
      const res = await fetch("/api/materials", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMat),
      })
      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ")
      const newMaterial = await res.json()
      setMaterials([{ ...newMaterial, totalStock: 0 }, ...materials])
      setIsAddOpen(false)
      toast.success("เพิ่มวัตถุดิบเรียบร้อย")
    } catch { toast.error("เกิดข้อผิดพลาด") }
    finally { setIsLoading(false) }
  }

  const handleTransaction = async () => {
    const amountVal = Number(txForm.amount)
    if (amountVal <= 0) return toast.error("กรุณาระบุจำนวนให้ถูกต้อง")
    if (txModal.type === "OUT" && txModal.mat && amountVal > txModal.mat.totalStock)
      return toast.error("จำนวนเบิกออก มากกว่าสต๊อกที่มีอยู่!")
    if (txModal.type === "IN" && (!txForm.totalCost || Number(txForm.totalCost) <= 0))
      return toast.error("กรุณากรอกราคารวมล๊อตนี้")
    setIsLoading(true)
    try {
      const res = await fetch("/api/materials/transaction", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: txModal.mat?.id, type: txModal.type, amount: amountVal,
          totalCost: txForm.totalCost ? Number(txForm.totalCost) : null,
          note: txForm.note,
          lotNumber: txModal.type === "IN" ? lotNumber || undefined : undefined,
          expireDate: txModal.type === "IN" && expireDate ? new Date(expireDate).toISOString() : null,
          materialLotId: txModal.type === "OUT" && txForm.materialLotId ? Number(txForm.materialLotId) : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).message || "อัปเดตสต๊อกไม่สำเร็จ")

      const freshList = await refreshMaterials()

      if (lotsModal.isOpen && lotsModal.mat && freshList) {
        const updatedMat = freshList.find((m: Material) => m.id === lotsModal.mat!.id)
        if (updatedMat) setLotsModal(prev => ({ ...prev, mat: updatedMat }))
      }

      setTxModal({ isOpen: false, mat: null, type: "IN" })
      setTxForm({ amount: "", note: "", totalCost: "", materialLotId: "" })
      setLotNumber(""); setExpireDate("")
      toast.success(`บันทึก${txModal.type === "IN" ? "รับเข้า" : "เบิกออก"}เรียบร้อย`)
    } catch (e: any) { toast.error(e.message || "เกิดข้อผิดพลาด") }
    finally { setIsLoading(false) }
  }

  const handleProduce = async () => {
    const amountVal = Number(produceForm.amount)
    if (!produceForm.variantId) return toast.error("กรุณาเลือกสินค้าที่จะผลิต")
    if (amountVal <= 0) return toast.error("กรุณาระบุจำนวนผลิตให้ถูกต้อง")
    setIsLoading(true)
    try {
      const res = await fetch("/api/materials/produce", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: Number(produceForm.variantId), produceAmount: amountVal, note: produceForm.note }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "ผลิตสินค้าไม่สำเร็จ วัตถุดิบอาจไม่เพียงพอ")
      await refreshMaterials()
      setIsProduceOpen(false)
      setProduceForm({ variantId: "", amount: "", note: "" })
      toast.success("เบิกวัตถุดิบเพื่อผลิตสินค้าเสร็จสิ้น")
    } catch (e: any) { toast.error(e.message) }
    finally { setIsLoading(false) }
  }

  return (
    <div className="p-4 xl:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
          <FlaskConical className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl xl:text-3xl font-black text-gray-900 tracking-tight">Materials Inventory</h1>
          <p className="text-[16px] text-gray-500 font-medium mt-1">จัดการข้อมูลวัตถุดิบ การเบิกใช้ และตรวจสอบจำนวนคงเหลือ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "วัตถุดิบทั้งหมด", value: stats.totalMaterials, unit: "รายการ", icon: <FlaskConical className="w-5 h-5 xl:w-6 xl:h-6" />, gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-200" },
          { label: "สต็อกต่ำ (≤10)", value: stats.lowStock, unit: "รายการ", icon: <AlertTriangle className="w-5 h-5 xl:w-6 xl:h-6" />, gradient: "from-orange-400 to-amber-500", shadow: "shadow-orange-200" },
          { label: "หมดสต็อก", value: stats.outOfStock, unit: "รายการ", icon: <PackageX className="w-5 h-5 xl:w-6 xl:h-6" />, gradient: "from-rose-500 to-red-600", shadow: "shadow-rose-200" },
          { label: "ใกล้หมดอายุ (30 วัน)", value: stats.nearExpiry, unit: "รายการ", icon: <Timer className="w-5 h-5 xl:w-6 xl:h-6" />, gradient: "from-purple-500 to-indigo-600", shadow: "shadow-purple-200" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 p-4 xl:p-6 flex items-center gap-3 xl:gap-5 group">
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-3 xl:p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs xl:text-sm text-gray-500 font-bold mb-1">{card.label}</p>
              <p className="text-xl xl:text-3xl font-black text-gray-900">
                {card.value} <span className="text-xs xl:text-base font-semibold text-gray-400">{card.unit}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100">

        {/* Toolbar */}
        <div className="p-4 xl:p-6 border-b border-gray-100 bg-gray-50/30 rounded-t-3xl">
          {/* Mobile: search แยกบน */}
          <div className="xl:hidden mb-3">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อวัตถุดิบ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Desktop: ทุกอย่างแถวเดียว | Mobile: sort + ปุ่ม */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Search — desktop only */}
            <div className="relative hidden xl:block group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อวัตถุดิบ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white transition-all shadow-sm"
              />
            </div>

            {/* Sort */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between border border-gray-200 rounded-2xl px-3 py-2.5 text-sm bg-white hover:border-emerald-300 focus:outline-none transition-all shadow-sm cursor-pointer font-bold text-gray-700 gap-2"
              >
                {SORT_OPTIONS.find(o => o.value === sort)?.label}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSortOpen ? "rotate-180 text-emerald-500" : ""}`} />
              </button>
              {isSortOpen && (
                <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1.5">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setIsSortOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${sort === opt.value
                          ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500"
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
              onClick={() => setIsProduceOpen(true)}
              className="bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 px-3 py-2.5 rounded-2xl text-xs xl:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Hammer className="w-4 h-4" />
              <span className="hidden sm:inline">เบิกผลิตสินค้า</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-2.5 rounded-2xl text-xs xl:text-sm font-bold transition-all shadow-xl hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">เพิ่มวัตถุดิบ</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div>
          <table className="w-full text-sm text-center">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">รหัส</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">ชื่อวัตถุดิบ</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">คงเหลือ</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">หน่วย</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden xl:table-cell">ต้นทุน/หน่วย</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                        <Search className="w-10 h-10 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-lg">ไม่พบวัตถุดิบ</p>
                        <p className="text-gray-400 font-medium mt-1">ไม่มีวัตถุดิบที่ตรงกับเงื่อนไขการค้นหา</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredAndSorted.map(mat => (
                <tr key={mat.id} className="hover:bg-teal-50/20 transition-colors group">
                  <td className="px-4 py-2">
                    <span className="font-bold text-gray-400 text-xs">{mat.code || "—"}</span>
                  </td>
                  <td className="px-4 py-2">
                    <p className="font-black text-gray-900 text-sm group-hover:text-teal-700 transition-colors">{mat.name}</p>
                    {/* แสดง หน่วย + ต้นทุน บนมือถือ */}
                    <p className="xl:hidden text-xs text-gray-400 font-medium mt-0.5">
                      {mat.unit} · ฿{(mat.costPerUnit ?? 0).toFixed(2)}/หน่วย
                    </p>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-xl font-black text-xs border whitespace-nowrap ${mat.totalStock === 0 ? "text-rose-600 bg-rose-50 border-rose-200" :
                        mat.totalStock <= 10 ? "text-orange-600 bg-orange-50 border-orange-200" :
                          "text-emerald-700 bg-emerald-50 border-emerald-200"
                      }`}>
                      {(mat.totalStock ?? 0).toLocaleString()} {mat.unit}
                    </span>
                  </td>
                  <td className="px-4 py-2 hidden xl:table-cell">
                    <span className="text-sm text-gray-500 font-medium">{mat.unit}</span>
                  </td>
                  <td className="px-4 py-2 hidden xl:table-cell">
                    <span className="text-sm font-bold text-gray-700">฿{(mat.costPerUnit ?? 0).toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-center">
                      <ActionMenu
                        onIn={() => setTxModal({ isOpen: true, mat, type: "IN" })}
                        onOut={() => setTxModal({ isOpen: true, mat, type: "OUT" })}
                        onLot={() => setLotsModal({ isOpen: true, mat })}
                        onHistory={() => { setSelectedHistoryId(mat.id); setSelectedHistoryName(mat.name); setHistoryModalOpen(true) }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSorted.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center rounded-b-3xl">
            <span className="text-sm font-medium text-gray-500">
              แสดงผล <strong className="text-gray-900">{filteredAndSorted.length}</strong> จาก <strong className="text-gray-900">{materials.length}</strong> รายการ
            </span>
          </div>
        )}
      </div>

      <AddMaterialModal
        isOpen={isAddOpen} onClose={() => setIsAddOpen(false)}
        newMat={newMat} setNewMat={setNewMat}
        onSubmit={handleAddMaterial} isLoading={isLoading}
      />
      <TransactionModal
        isOpen={txModal.isOpen} mat={txModal.mat} type={txModal.type}
        onClose={() => { setTxModal({ isOpen: false, mat: null, type: "IN" }); setTxForm({ amount: "", totalCost: "", note: "", materialLotId: "" }) }}
        txForm={txForm} setTxForm={setTxForm}
        lotNumber={lotNumber} setLotNumber={setLotNumber}
        expireDate={expireDate} setExpireDate={setExpireDate}
        noExpire={noExpire} setNoExpire={setNoExpire}
        onSubmit={handleTransaction} isLoading={isLoading}
        currentStock={materials.find(m => m.id === txModal.mat?.id)?.totalStock ?? txModal.mat?.totalStock ?? 0}
        currentLots={materials.find(m => m.id === txModal.mat?.id)?.MaterialLot ?? []}
      />
      <ProduceModal
        isOpen={isProduceOpen} onClose={() => setIsProduceOpen(false)}
        products={products} produceForm={produceForm} setProduceForm={setProduceForm}
        isProductDropdownOpen={isProductDropdownOpen} setIsProductDropdownOpen={setIsProductDropdownOpen}
        productDropdownRef={productDropdownRef} onSubmit={handleProduce} isLoading={isLoading}
      />
      <LotsModal
        isOpen={lotsModal.isOpen}
        mat={lotsModal.isOpen && lotsModal.mat
          ? materials.find(m => m.id === lotsModal.mat!.id) ?? lotsModal.mat
          : null
        }
        onClose={() => setLotsModal({ isOpen: false, mat: null })}
      />
      <MaterialHistoryModal
        open={historyModalOpen} materialId={selectedHistoryId}
        materialName={selectedHistoryName} onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  )
}