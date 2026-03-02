"use client"

import { useState, useEffect, useRef } from "react"
import { Plus, Trash2, BookOpen, X, ChevronDown, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

type Variant = {
  id: number
  product: { Pname: string }
  price: number | null
  values?: {
    optionValue: {
      value: string
      option: { name: string }
    }
  }[]
}

type Material = {
  id: number
  name: string
  unit: string
}

type Recipe = {
  id: number
  materialId: number
  quantity: number
  material: Material
}

type Props = {
  open: boolean
  onClose: () => void
}

export default function ProductRecipeModal({ open, onClose }: Props) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ materialId: "", quantity: "" })

  const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null)

  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false)
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false)
  const variantDropdownRef = useRef<HTMLDivElement>(null)
  const materialDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variantDropdownRef.current && !variantDropdownRef.current.contains(event.target as Node)) {
        setIsVariantDropdownOpen(false)
      }
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(event.target as Node)) {
        setIsMaterialDropdownOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return 
    const fetchData = async () => {
      try {
        const [variantsRes, materialsRes] = await Promise.all([
          fetch("/api/variants"), 
          fetch("/api/materials")
        ])
        if (variantsRes.ok) setVariants(await variantsRes.json())
        if (materialsRes.ok) setMaterials(await materialsRes.json())
      } catch (error) {
        console.error("Failed to load data", error)
      }
    }
    fetchData()
  }, [open])

  useEffect(() => {
    if (!selectedVariantId || !open) {
      setRecipes([])
      return
    }
    const fetchRecipes = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/recipes?variantId=${selectedVariantId}`)
        if (res.ok) {
          const data = await res.json()
          setRecipes(data)
        }
      } catch (error) {
        toast.error("โหลดสูตรการผลิตไม่สำเร็จ")
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecipes()
  }, [selectedVariantId, open])

  const getVariantLabel = (v: Variant) => {
    if (!v.values || v.values.length === 0) return v.product.Pname
    const optionsStr = v.values.map(val => val.optionValue.value).join(' / ')
    return `${v.product.Pname} - ${optionsStr}`
  }

  const selectedVariantLabel = selectedVariantId 
    ? getVariantLabel(variants.find(v => v.id.toString() === selectedVariantId)!) 
    : "-- เลือกสินค้า --"

  const selectedMaterialLabel = form.materialId 
    ? materials.find(m => m.id.toString() === form.materialId)?.name 
    : "-- เลือกวัตถุดิบ --"

  const handleAddRecipe = async () => {
    if (!selectedVariantId) return toast.error("กรุณาเลือกสินค้าก่อน")
    if (!form.materialId || !form.quantity || Number(form.quantity) <= 0) {
      return toast.error("กรุณาเลือกวัตถุดิบและใส่จำนวนให้ถูกต้อง")
    }
    setIsLoading(true)
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: Number(selectedVariantId),
          materialId: Number(form.materialId),
          quantity: Number(form.quantity)
        })
      })
      if (!res.ok) throw new Error((await res.json()).error || "เกิดข้อผิดพลาด")
      setRecipes([...recipes, await res.json()])
      setForm({ materialId: "", quantity: "" })
      toast.success("เพิ่มวัตถุดิบในสูตรเรียบร้อย")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (recipeToDelete === null) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/recipes/${recipeToDelete}`, { method: "DELETE" })
      if (!res.ok) throw new Error("ลบไม่สำเร็จ")
      setRecipes(recipes.filter(r => r.id !== recipeToDelete))
      toast.success("ลบออกจากสูตรแล้ว")
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการลบ")
    } finally {
      setRecipeToDelete(null)
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity duration-300">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">
          
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">จัดการสูตรการผลิต</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto bg-gray-50/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="md:col-span-1">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                  เลือกสินค้าที่จะตั้งสูตร
                </label>
                
                <div className="relative" ref={variantDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
                    className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm transition-all cursor-pointer"
                  >
                    <span className="truncate font-medium">{selectedVariantLabel}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform duration-200 ${isVariantDropdownOpen ? 'rotate-180 text-purple-500' : ''}`} />
                  </button>

                  {isVariantDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-60 overflow-y-auto py-2">
                      {variants.map(v => (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariantId(v.id.toString())
                            setIsVariantDropdownOpen(false)
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                            selectedVariantId === v.id.toString()
                              ? "bg-purple-50 text-purple-700 font-bold border-l-4 border-purple-500"
                              : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                          }`}
                        >
                          {getVariantLabel(v)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedVariantId && (
                  <div className="mt-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <span className="bg-purple-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                      เพิ่มวัตถุดิบเข้าสูตร
                    </label>
                    <div className="space-y-4">
                      
                      <div className="relative" ref={materialDropdownRef}>
                        <button
                          type="button"
                          onClick={() => setIsMaterialDropdownOpen(!isMaterialDropdownOpen)}
                          className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white transition-all cursor-pointer"
                        >
                          <span className="truncate">{selectedMaterialLabel}</span>
                          <ChevronDown className={`w-4 h-4 text-gray-400 ml-2 transition-transform duration-200 ${isMaterialDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isMaterialDropdownOpen && (
                          <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto py-2">
                            {materials.map(m => (
                              <button
                                key={m.id}
                                onClick={() => {
                                  setForm({...form, materialId: m.id.toString()})
                                  setIsMaterialDropdownOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                                  form.materialId === m.id.toString()
                                    ? "bg-purple-50 text-purple-700 font-bold"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                              >
                                {m.name} <span className="text-gray-400 text-xs ml-1">({m.unit})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <input 
                          type="number"
                          placeholder="จำนวนที่ใช้ต่อ 1 ชิ้น"
                          value={form.quantity}
                          onChange={(e) => setForm({...form, quantity: e.target.value})}
                          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white focus:bg-white transition-all"
                        />
                      </div>
                      
                      <button 
                        onClick={handleAddRecipe}
                        disabled={isLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-sm hover:shadow cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> เพิ่มลงสูตรเลย
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                {selectedVariantId ? (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-100 p-1.5 rounded-md"><BookOpen className="w-5 h-5 text-purple-600" /></span>
                        ส่วนผสมที่ใช้ต่อ 1 ชิ้น
                      </div>
                      <span className="text-sm bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-full border border-purple-100">
                        {recipes.length} รายการ
                      </span>
                    </h3>
                    
                    {recipes.length > 0 ? (
                      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex-1">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50/50 text-gray-500 font-semibold border-b border-gray-100 text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-6 py-4">วัตถุดิบ</th>
                              <th className="px-6 py-4 text-right">จำนวนที่ใช้</th>
                              <th className="px-6 py-4">หน่วย</th>
                              <th className="px-6 py-4 text-center w-24">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {recipes.map((r) => (
                              <tr key={r.id} className="hover:bg-purple-50/30 transition-colors group">
                                <td className="px-6 py-4 font-bold text-gray-700">{r.material.name}</td>
                                <td className="px-6 py-4 text-right font-bold text-purple-600 text-base">{r.quantity}</td>
                                <td className="px-6 py-4 text-gray-500 font-medium">{r.material.unit}</td>
                                <td className="px-6 py-4 text-center">
                                  <button 
                                    onClick={() => setRecipeToDelete(r.id)}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all opacity-50 group-hover:opacity-100"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 py-16">
                        <div className="bg-gray-50 p-4 rounded-full mb-3">
                          <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-bold text-gray-500">ยังไม่มีสูตรการผลิต</p>
                        <p className="text-sm mt-1">เพิ่มวัตถุดิบจากเมนูด้านซ้ายเพื่อเริ่มต้น</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 min-h-[400px]">
                    <div className="bg-white p-5 rounded-full shadow-sm border border-gray-100 mb-4">
                      <BookOpen className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-600 text-lg">กรุณาเลือกสินค้า</p>
                    <p className="text-sm mt-1">เพื่อจัดการสูตรการผลิตสำหรับสินค้านั้น</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ยืนยันการลบแบบสวยงาม */}
      {recipeToDelete !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-4 border-4 border-red-100">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการลบวัตถุดิบ?</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              การนำวัตถุดิบนี้ออกจากสูตร จะส่งผลให้การผลิตครั้งต่อไปไม่หักสต๊อกวัตถุดิบตัวนี้อีก คุณแน่ใจหรือไม่?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setRecipeToDelete(null)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {isLoading ? "กำลังลบ..." : "ใช่, ลบเลย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}