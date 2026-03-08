"use client"

import { X, Plus, ImagePlus, Trash2, Columns, ArrowUpDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type EditProductModalProps = {
  productId: number | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditProductModal({ productId, open, onClose, onSuccess }: EditProductModalProps) {
  const [name, setName] = useState("")
  const [materials, setMaterials] = useState<any[]>([])
  const [options, setOptions] = useState<string[]>([])
  const [variants, setVariants] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open && productId) {
      setIsFetching(true)

      fetch("/api/materials").then(res => res.json()).then(setMaterials)

      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          setName(data.Pname || "")
          setImages(data.images?.map((img: any) => img.url) || [])

          let fetchedOptions: string[] = []
          if (data.Option && data.Option.length > 0) {
            fetchedOptions = data.Option.map((opt: any) => opt.name)
          }
          setOptions(fetchedOptions)

          const formattedVariants = (data.variants || []).map((v: any) => ({
            id: v.id,
            values: v.values && v.values.length > 0
              ? v.values.map((val: any) => val.optionValue?.value || "")
              : Array(fetchedOptions.length).fill(""),
            price: v.price || 0,
            stock: (v.productVariantLots || []).reduce((sum: number, lot: any) => sum + lot.stock, 0),
            recipes: v.recipes || [],
            isNew: false
          })).sort((a: any, b: any) => {
            for (let i = 0; i < fetchedOptions.length; i++) {
              const valA = a.values[i] || ""
              const valB = b.values[i] || ""
              const comparison = valA.localeCompare(valB, 'th', { numeric: true })
              if (comparison !== 0) return comparison
            }
            return 0
          })

          setVariants(formattedVariants)
        })
        .finally(() => setIsFetching(false))
    }
  }, [open, productId])

  const sortVariants = () => {
    const sorted = [...variants].sort((a, b) => {
      for (let i = 0; i < options.length; i++) {
        const valA = a.values[i] || ""
        const valB = b.values[i] || ""
        const comparison = valA.localeCompare(valB, 'th', { numeric: true })
        if (comparison !== 0) return comparison
      }
      return 0
    })
    setVariants(sorted)
  }

  const removeImage = (index: number) => setImages(prev => prev.filter((_, i) => i !== index))

  const addOptionColumn = () => {
    setOptions([...options, "ตัวเลือกใหม่"])
    setVariants(variants.map(v => ({ ...v, values: [...v.values, ""] })))
  }

  const updateOptionName = (index: number, newName: string) => {
    const newOptions = [...options]
    newOptions[index] = newName
    setOptions(newOptions)
  }

  const removeOptionColumn = (index: number) => {
    setOptions(prev => prev.filter((_: any, i: number) => i !== index))
    setVariants(prev => prev.map(v => ({
      ...v,
      values: v.values.filter((_: any, i: number) => i !== index)
    })))
  }

  const addNewVariantRow = () => {
    setVariants([...variants, {
      id: `new-${Date.now()}`,
      values: Array(options.length).fill(""),
      price: 0,
      stock: 0,
      recipes: [],
      isNew: true
    }])
  }

  const updateVariantValue = (variantIndex: number, valueIndex: number, newValue: string) => {
    const newVariants = [...variants]
    newVariants[variantIndex].values[valueIndex] = newValue
    setVariants(newVariants)
  }

  const updateVariantPrice = (variantIndex: number, newPrice: number) => {
    const newVariants = [...variants]
    newVariants[variantIndex].price = newPrice
    setVariants(newVariants)
  }

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const payload = {
        name,
        imageUrls: images,
        options,
        variants: variants.map(v => ({
          id: v.isNew ? undefined : v.id,
          values: v.values,
          price: v.price
        }))
      }

      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("บันทึกการเปลี่ยนแปลงไม่สำเร็จ")
      toast.success("อัปเดตรายละเอียดสินค้าเรียบร้อย")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">รายละเอียดสินค้า & ตัวเลือกแบบละเอียด</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isFetching ? (
          <div className="text-center py-20 text-gray-500 animate-pulse flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            กำลังดึงข้อมูลสินค้า...
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── รูปภาพ + ชื่อสินค้า ── */}
            <div className="flex flex-col md:flex-row gap-8 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <div className="w-full md:w-auto flex flex-col gap-3">
                <label className="text-sm font-semibold text-gray-700">รูปภาพสินค้า</label>
                <div className="flex gap-3 flex-wrap">
                  {images.map((url, index) => (
                    <div key={index} className="relative w-28 h-28 rounded-xl overflow-hidden group shadow-sm border border-gray-200">
                      <img src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => removeImage(index)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-28 h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors cursor-pointer
                      ${isUploading
                        ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600"
                      }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-xs font-medium">กำลังอัปโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 mb-2" />
                        <span className="text-xs font-medium">เพิ่มรูปภาพ</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      if (!e.target.files?.[0]) return
                      try {
                        setIsUploading(true)
                        const formData = new FormData()
                        formData.append("file", e.target.files[0])
                        const res = await fetch("/api/upload", { method: "POST", body: formData })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error || "Upload failed")
                        if (data.imageUrl) setImages(prev => [...prev, data.imageUrl])
                      } catch (err: any) {
                        toast.error(err.message)
                      } finally {
                        setIsUploading(false)
                        e.target.value = ""
                      }
                    }}
                  />
                </div>
              </div>

              <div className="w-full md:flex-1 flex flex-col justify-center">
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อสินค้าหลัก</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition text-lg font-medium shadow-sm"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            {/* ── Variant Matrix ── */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Columns className="w-5 h-5 text-purple-600" />
                  จัดการรูปแบบตัวเลือก (Variant Matrix)
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={sortVariants} className="text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-1 font-medium transition border border-gray-200 cursor-pointer">
                    <ArrowUpDown className="w-4 h-4" /> เรียงข้อมูล
                  </button>
                  <button onClick={addOptionColumn} className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg flex items-center gap-1 font-medium transition border border-blue-200 cursor-pointer">
                    <Plus className="w-4 h-4" /> เพิ่มหัวข้อตัวเลือก (คอลัมน์)
                  </button>
                  <button onClick={addNewVariantRow} className="text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-2 rounded-lg flex items-center gap-1 font-medium transition border border-purple-200 cursor-pointer">
                    <Plus className="w-4 h-4" /> เพิ่มรายการย่อย (แถว)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-100 text-gray-700 border-b">
                    <tr>
                      {options.map((opt, idx) => (
                        <th key={idx} className="p-3 font-semibold min-w-[150px]">
                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md border border-gray-200">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOptionName(idx, e.target.value)}
                              className="w-full outline-none font-semibold text-gray-700 bg-transparent"
                              placeholder="ระบุชื่อ (เช่น สี)"
                            />
                            <button type="button" onClick={() => removeOptionColumn(idx)} className="text-red-400 hover:text-red-600 cursor-pointer">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="p-3 font-semibold text-center w-32">ราคา (฿)</th>
                      <th className="p-3 font-semibold text-center w-28">คงเหลือ</th>
                      <th className="p-3 font-semibold w-64">สูตรการผลิต</th>
                      <th className="p-3 font-semibold text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variants.map((variant, rowIdx) => (
                      <tr key={variant.id} className={`hover:bg-purple-50/30 transition-colors ${variant.isNew ? 'bg-green-50/20' : ''}`}>
                        {options.map((_, colIdx) => (
                          <td key={colIdx} className="p-3">
                            <input
                              type="text"
                              value={variant.values[colIdx] || ""}
                              onChange={(e) => updateVariantValue(rowIdx, colIdx, e.target.value)}
                              placeholder={`ค่าของ ${options[colIdx] || 'ตัวเลือก'}`}
                              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white"
                            />
                          </td>
                        ))}
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            value={variant.price}
                            onChange={(e) => updateVariantPrice(rowIdx, Number(e.target.value))}
                            className="w-full border border-gray-300 px-2 py-2 rounded-lg text-center focus:ring-2 focus:ring-purple-500 outline-none font-medium bg-white"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${variant.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                            {variant.stock} ชิ้น
                          </span>
                        </td>
                        <td className="p-3">
                          {variant.isNew ? (
                            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">ตั้งค่าสูตรหลังบันทึก</span>
                          ) : (
                            <div className="max-h-20 overflow-y-auto pr-2">
                              <ul className="list-disc pl-4 text-xs space-y-1 text-gray-600">
                                {variant.recipes && variant.recipes.length > 0 ? (
                                  variant.recipes.map((r: any, rIdx: number) => {
                                    const mat = materials.find(m => m.id === r.materialId)
                                    return (
                                      <li key={rIdx}>
                                        <span className="font-medium text-gray-800">{mat?.name || "ไม่ทราบชื่อ"}</span> : {r.quantity} {mat?.unit || ""}
                                      </li>
                                    )
                                  })
                                ) : (
                                  <span className="text-gray-400 list-none">- ไม่มีสูตร -</span>
                                )}
                              </ul>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => removeVariantRow(rowIdx)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition cursor-pointer">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {variants.length === 0 && (
                      <tr>
                        <td colSpan={options.length + 4} className="text-center py-12 text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-lg">ยังไม่มีรายการย่อย</span>
                            <button onClick={addNewVariantRow} className="text-purple-600 hover:underline text-sm font-medium">
                              คลิกเพื่อเพิ่มรายการแรก
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200 gap-3 mt-8">
              <button onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition cursor-pointer">
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-purple-500/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {isLoading ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}