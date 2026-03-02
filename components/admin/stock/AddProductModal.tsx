"use client"

import { ImagePlus, Trash2, X, Plus, Package, Tags, Palette, DollarSign } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

type OptionValue = { value: string }
type ProductOption = { name: string; values: OptionValue[] }
type Variant = { key: string; combination: string[]; price: number }

export default function AddProductModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [images, setImages] = useState<string[]>([])

  const [options, setOptions] = useState<ProductOption[]>([])
  const [variants, setVariants] = useState<Variant[]>([])

  const [simplePrice, setSimplePrice] = useState(0)

  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ================= 1. REGENERATE VARIANTS =================
  useEffect(() => {
    if (options.length === 0) {
      setVariants([])
      return
    }

    const valueArrays = options.map((opt) => opt.values.map((v) => v.value.trim()).filter(Boolean))
    if (valueArrays.some((arr) => arr.length === 0)) return

    const cartesian = (arr: string[][]): string[][] =>
      arr.reduce((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]] as string[][])

    const combinations = cartesian(valueArrays)

    setVariants((prev) =>
      combinations.map((combo) => {
        const key = combo.join("|")
        const oldVariant = prev.find((v) => v.key === key)
        if (oldVariant) return { ...oldVariant, combination: combo }
        return { key, combination: combo, price: 0 }
      })
    )
  }, [options])


  // ================= 2. SAVE DATA =================
  const handleSave = async () => {
    if (!name.trim()) return toast.error("กรุณากรอกชื่อสินค้า")

    setIsLoading(true)
    try {
      let finalVariants = []

      if (options.length === 0) {
        finalVariants = [{ key: "default", combination: [], price: simplePrice }]
      } else {
        finalVariants = variants.map((v) => ({
          key: v.key,
          combination: v.combination,
          price: Number(v.price),
        }))
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          imageUrls: images,
          options,
          variants: finalVariants,
        }),
      })

      if (!res.ok) throw new Error("สร้างสินค้าไม่สำเร็จ")

      toast.success("เพิ่มสินค้าเรียบร้อยแล้ว")
      setName(""); setImages([]); setOptions([]); setVariants([]);
      setSimplePrice(0);

      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ================= 3. UTILS & ACTIONS =================
  const removeImage = (indexToRemove: number) => setImages((prev) => prev.filter((_, index) => index !== indexToRemove))
  const updateVariant = (key: string, field: string, value: any) => setVariants((prev) => prev.map((v) => (v.key === key ? { ...v, [field]: value } : v)))

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-gray-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">

        <div className="sticky top-0 bg-white px-8 py-5 border-b border-gray-100 flex justify-between items-center z-10 rounded-t-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">สร้างสินค้าใหม่</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">เพิ่มรายละเอียดและตัวเลือกของสินค้า</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" /> 
          </button>
        </div>

        <div className="p-8 space-y-8">

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ImagePlus className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-bold text-gray-700">รูปภาพสินค้า</label>
            </div>
            <div className="flex gap-4 flex-wrap">
              {images.map((url, index) => (
                <div key={index} className="relative w-28 h-28 rounded-xl overflow-hidden group shadow-sm border border-gray-200">
                  <img src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => removeImage(index)} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transform hover:scale-110 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors cursor-pointer"
              >
                <Plus className="w-6 h-6 mb-2" />
                <span className="text-xs font-medium">เพิ่มรูปภาพ</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={async (e) => {
                if (!e.target.files?.[0]) return
                const formData = new FormData(); formData.append("file", e.target.files[0])
                const res = await fetch("/api/upload", { method: "POST", body: formData })
                const data = await res.json()
                if (data.url) setImages((prev) => [...prev, data.url])
              }} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Tags className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-bold text-gray-700">ชื่อสินค้า (Product Name) <span className="text-red-500">*</span></label>
            </div>
            <input
              className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ยาเส้นกลิ่นผลไม้รวม เกรดพรีเมียม"
            />
          </div>

          {options.length === 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-bold text-gray-700">ราคาสินค้า (บาท) <span className="text-red-500">*</span></label>
              </div>
              <div className="relative max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
                <input
                  type="number"
                  min="0"
                  className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-gray-700 font-semibold text-lg"
                  value={simplePrice || ""}
                  onChange={(e) => setSimplePrice(Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                * หากสินค้านี้มีหลายราคา (เช่น ขนาดเล็ก/ใหญ่) ให้กดเพิ่ม "ตัวเลือกสินค้า" ด้านล่างแทน
              </p>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-bold text-gray-700">ตัวเลือกสินค้า (Options)</label>
              </div>
              <button
                type="button"
                onClick={() => setOptions([...options, { name: "", values: [] }])}
                className="text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่ตัวเลือก
              </button>
            </div>

            <div className="space-y-4">
              {options.length === 0 && (
                <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                  สินค้านี้ยังไม่มีตัวเลือก (เช่น ขนาด, สี, กลิ่น)
                </div>
              )}
              {options.map((opt, optionIndex) => (
                <div key={optionIndex} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-gray-500 mb-1 block uppercase tracking-wider">ชื่อตัวเลือก</label>
                      <input
                        type="text"
                        placeholder="เช่น ขนาด, กลิ่น, รสชาติ"
                        value={opt.name}
                        onChange={(e) => { const updated = [...options]; updated[optionIndex].name = e.target.value; setOptions(updated) }}
                        className="w-full sm:w-1/2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium text-gray-700"
                      />
                    </div>
                    <button type="button" onClick={() => setOptions(options.filter((_, i) => i !== optionIndex))} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors mt-4 cursor-pointer">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-2 block uppercase tracking-wider">ค่าย่อย (เช่น 30ml, 50ml)</label>
                    <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {opt.values.map((val, valueIndex) => (
                        <div key={valueIndex} className="flex items-center bg-white border border-gray-200 rounded-full pl-3 pr-1 py-1 shadow-sm">
                          <input
                            type="text"
                            placeholder="ระบุค่า"
                            value={val.value}
                            onChange={(e) => { const updated = [...options]; updated[optionIndex].values[valueIndex].value = e.target.value; setOptions(updated) }}
                            className="w-20 sm:w-28 text-sm outline-none bg-transparent font-medium text-gray-700 placeholder-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => { const updated = [...options]; updated[optionIndex].values = updated[optionIndex].values.filter((_, i) => i !== valueIndex); setOptions(updated) }}
                            className="text-gray-400 hover:text-red-500 hover:bg-gray-100 p-1 rounded-full transition-colors cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => { const updated = [...options]; updated[optionIndex].values.push({ value: "" }); setOptions(updated) }}
                        className="text-purple-600 bg-purple-50 hover:bg-purple-100 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors border border-purple-100 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> เพิ่มค่า
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {variants.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-700">ตั้งค่าราคาสินค้าแยกตามตัวเลือก</h3>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {options.map((opt, i) => (
                        <th key={i} className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs">
                          {opt.name || `Option ${i + 1}`}
                        </th>
                      ))}
                      <th className="py-3 px-4 font-semibold text-gray-600 uppercase tracking-wider text-xs w-40 text-right">
                        ราคา (บาท)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {variants.map((variant, rowIndex) => (
                      <tr key={`variant-${rowIndex}`} className="hover:bg-purple-50/30 transition-colors">
                        {variant.combination.map((value, colIndex) => {
                          const span = getRowSpan(variants, rowIndex, colIndex)
                          if (!span) return null
                          return (
                            <td key={`${variant.key}-${colIndex}`} rowSpan={span} className={`py-3 px-4 align-middle bg-white border-r border-gray-100 ${span > 1 ? 'border-b' : ''}`}>
                              <span className="font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{value || '-'}</span>
                            </td>
                          )
                        })}
                        <td className="py-3 px-4 align-middle text-right bg-white">
                          <div className="relative inline-block w-full max-w-[120px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">฿</span>
                            <input
                              type="number"
                              min="0"
                              value={variant.price}
                              onChange={(e) => updateVariant(variant.key, "price", Number(e.target.value))}
                              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-right focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-semibold text-purple-700 transition-all shadow-sm"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex justify-end gap-3 rounded-b-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md flex items-center gap-2 cursor-pointer ${isLoading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg hover:-translate-y-0.5"}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              </>
            ) : "บันทึกข้อมูลสินค้า"}
          </button>
        </div>
      </div>
    </div>
  )
}

function getRowSpan(variants: Variant[], rowIndex: number, colIndex: number) {
  const value = variants[rowIndex].combination[colIndex]
  if (rowIndex > 0 && variants[rowIndex - 1].combination[colIndex] === value) return 0
  let span = 1
  for (let i = rowIndex + 1; i < variants.length; i++) {
    if (variants[i].combination[colIndex] === value) span++
    else break
  }
  return span
}