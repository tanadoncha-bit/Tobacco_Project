"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown, PackagePlus, FileText, Edit, Plus, BookOpen, PackageSearch, X, ArrowDownToLine, ArrowUpFromLine, Boxes, Layers } from "lucide-react"

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

export default function StockTable({ data, userRole }: { data: StockItem[], userRole: string }) {

  const [selectedUnit, setSelectedUnit] = useState<string>("ชิ้น")

  const canAdjustStock = userRole === "ADMIN" || userRole === "MANAGER";
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"newest" | "oldest" | "stock-high" | "stock-low" | "name-az" | "name-za">("newest")

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

        <div className="relative z-10 p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">

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
              onClick={() => setIsReceiveProduceOpen(true)}
              className="flex-1 sm:flex-none bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" /> รับเข้าผลิต
            </button>

            <button
              onClick={() => setRecipeModalOpen(true)}
              className="flex-1 sm:flex-none bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-purple-300 hover:text-purple-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" /> สูตรการผลิต
            </button>
            <button
              onClick={() => setOpen(true)}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> เพิ่มสินค้าใหม่
            </button>
          </div>
        </div>

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
                    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-sm border ${item.stock <= 5
                      ? 'text-red-600 bg-red-50 border-red-100'
                      : 'text-purple-700 bg-purple-50 border-purple-100'
                      }`}>
                      {item.stock} ชิ้น
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {canAdjustStock && (
                        <>
                          <button
                            onClick={() => { setAdjustProductId(item.Pid); setAdjustStockOpen(true) }}
                            className="bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            title="รับเข้าสต๊อกแบบแมนนวล (เฉพาะ Admin)"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" /> เพิ่มจำนวน
                          </button>

                          <button
                            onClick={() => {
                              setDispatchProductId(item.Pid);
                              setDispatchProductName(item.name);
                              setDispatchOpen(true);
                            }}
                            className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            title="เบิกสินค้าไปขาย / ตัดของเสีย"
                          >
                            <ArrowUpFromLine className="w-3.5 h-3.5" /> เบิกออก
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setSelectedLotProductCode(item.productCode)
                          setSelectedLotProductId(item.Pid)
                          setSelectedLotProductName(item.name)
                          setSelectedUnit("ชิ้น") // หรือ item.unit ถ้ามี
                          setLotModalOpen(true)
                        }}
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" /> ล๊อต
                      </button>

                      <button
                        onClick={() => { setEditProductId(item.Pid); setEditModalOpen(true) }}
                        className="bg-white text-gray-700 hover:text-purple-700 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> รายละเอียด
                      </button>

                      <button
                        onClick={() => {
                          setSelectedSlipId(item.Pid)
                          setSelectedSlipName(item.name)
                          setSlipModalOpen(true)
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
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 bg-gray-50/50">
                    <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    ไม่พบข้อมูลสินค้าที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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

        <AdjustStockModal
          open={adjustStockOpen}
          productId={adjustProductId}
          onClose={() => { setAdjustStockOpen(false); setAdjustProductId(null) }}
          onSuccess={() => router.refresh()}
        />
        <ReceiveProduceModal
          open={isReceiveProduceOpen}
          onSuccess={() => router.refresh()}
          onClose={() => setIsReceiveProduceOpen(false)}
        />

        <ProductLotModal
          open={lotModalOpen}
          productCode={selectedLotProductCode}
          productId={selectedLotProductId}
          productName={selectedLotProductName}
          unit={selectedUnit}
          onClose={() => {
            setLotModalOpen(false)
            setSelectedLotProductId(null)
          }}
        />
        {dispatchOpen && dispatchProductId && (
          <DispatchProductModal
            open={dispatchOpen}
            productId={dispatchProductId}
            productName={dispatchProductName}
            onClose={() => { setDispatchOpen(false); setDispatchProductId(null) }}
            onSuccess={() => router.refresh()}
          />
        )}
      </div>
    </div>
  )
}