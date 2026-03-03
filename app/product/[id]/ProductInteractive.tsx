"use client"

import { useState, useMemo, useEffect } from "react"
import { PackageSearch, ChevronLeft, ChevronRight, Shield, Truck, RotateCcw, Tag } from "lucide-react"
import AddToCart from "./AddToCart"

export default function ProductInteractive({ product }: { product: any }) {
  const images = product.images ?? []
  const [imgIndex, setImgIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product.Option?.length > 0) {
      const init: Record<string, string> = {}
      product.Option.forEach((opt: any) => {
        if (opt.values?.length > 0) init[opt.name] = opt.values[0].value
      })
      setSelectedOptions(init)
    }
  }, [product.Option])

  const currentVariant = useMemo(() => {
    if (!product.variants?.length) return null
    if (!product.Option?.length)   return product.variants[0]
    return product.variants.find((v: any) => {
      const vals = v.values.map((val: any) => val.optionValue.value)
      const sel  = Object.values(selectedOptions)
      return sel.every(s => vals.includes(s)) && sel.length === vals.length
    })
  }, [selectedOptions, product.variants, product.Option])

  const price    = currentVariant?.price ?? 0
  const stock    = currentVariant?.stock ?? 0
  const variantId = currentVariant?.id ?? 0

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* ── รูปภาพ ─────────────────────────────────────── */}
        <div className="bg-gray-50 relative flex flex-col">
          <div className="aspect-square relative overflow-hidden">
            {images.length > 0 ? (
              <>
                <img
                  src={images[imgIndex]?.url}
                  alt={product.Pname}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setImgIndex(i => (i === 0 ? images.length - 1 : i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition cursor-pointer">
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <button onClick={() => setImgIndex(i => (i === images.length - 1 ? 0 : i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-md hover:bg-white transition cursor-pointer">
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_: any, i: number) => (
                        <button key={i} onClick={() => setImgIndex(i)}
                          className={`rounded-full transition-all cursor-pointer ${i === imgIndex ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/50"}`} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                <PackageSearch className="w-16 h-16" />
                <span className="text-sm font-medium">ไม่มีรูปภาพ</span>
              </div>
            )}
            {stock <= 0 && (
              <div className="absolute top-3 left-3 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md">
                หมดชั่วคราว
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {images.map((img: any, i: number) => (
                <button key={i} onClick={() => setImgIndex(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${i === imgIndex ? "border-purple-500 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── รายละเอียด ──────────────────────────────────── */}
        <div className="p-6 md:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">

            <div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded-full">
                สินค้าแนะนำ
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mt-3">{product.Pname}</h1>
              {product.productCode && (
                <p className="text-xs text-gray-400 font-medium mt-1">รหัส: {product.productCode}</p>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-700">฿{price.toLocaleString()}</span>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Options */}
            {product.Option?.length > 0 && (
              <div className="space-y-4">
                {product.Option.map((opt: any) => (
                  <div key={opt.id}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{opt.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((val: any) => {
                        const isSelected = selectedOptions[opt.name] === val.value
                        return (
                          <button
                            key={val.id}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val.value }))}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                              isSelected
                                ? "border-purple-500 bg-purple-500 text-white shadow-md shadow-purple-200"
                                : "border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600"
                            }`}
                          >
                            {val.value}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AddToCart */}
          <div>
            <AddToCart variantId={variantId} stock={stock} price={price} />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            {[
              { icon: <Truck className="w-3.5 h-3.5" />,      label: "จัดส่งฟรี" },
              { icon: <Shield className="w-3.5 h-3.5" />,     label: "สินค้าแท้ 100%" },
              { icon: <RotateCcw className="w-3.5 h-3.5" />,  label: "คืนสินค้าได้" },
              { icon: <Tag className="w-3.5 h-3.5" />,        label: "ราคาดีที่สุด" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                <span className="text-purple-500">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}