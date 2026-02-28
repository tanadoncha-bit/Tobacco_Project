export const dynamic = "force-dynamic";

"use client"

import { useState, useMemo, useEffect } from "react"
import { PackageSearch } from "lucide-react"
import AddToCart from "./AddToCart" // เรียกใช้ปุ่มตะกร้าของคุณ

export default function ProductInteractive({ product }: { product: any }) {
  const imageUrl = product.images?.[0]?.url

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product.Option && product.Option.length > 0) {
      const initialSelections: Record<string, string> = {}
      product.Option.forEach((opt: any) => {
        if (opt.values && opt.values.length > 0) {
          initialSelections[opt.name] = opt.values[0].value
        }
      })
      setSelectedOptions(initialSelections)
    }
  }, [product.Option])

  const currentVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    if (!product.Option || product.Option.length === 0) return product.variants[0];

    return product.variants.find((v: any) => {
      const variantOptions = v.values.map((val: any) => val.optionValue.value)
      const selectedValues = Object.values(selectedOptions)
      // เช็คว่าค่าที่เลือกทั้งหมด ตรงกับค่าของ Variant ตัวนี้ไหม
      return selectedValues.every(val => variantOptions.includes(val)) && selectedValues.length === variantOptions.length
    })
  }, [selectedOptions, product.variants, product.Option])

  // ข้อมูลของ Variant ที่กำลังเลือกอยู่
  const price = currentVariant?.price || 0
  const stock = currentVariant?.stock || 0
  const variantId = currentVariant?.id || 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        
        {/* ================= ซ้าย: รูปภาพสินค้า ================= */}
        <div className="bg-gray-100 aspect-square md:aspect-auto flex items-center justify-center relative p-4">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.Pname} 
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            <div className="flex flex-col items-center">
              <PackageSearch className="w-24 h-24 text-gray-300 mb-4" />
              <span className="text-gray-400 text-sm">ไม่มีรูปภาพสินค้า</span>
            </div>
          )}
          
          {stock <= 0 && (
            <div className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 rounded-lg shadow-sm">
              หมดชั่วคราว
            </div>
          )}
        </div>

        {/* ================= ขวา: รายละเอียด & การสั่งซื้อ ================= */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          <span className="text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full w-fit mb-4">
            สินค้าแนะนำ
          </span>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.Pname}</h1>
          <p className="text-2xl font-extrabold text-[#2E4BB1] mb-6">
            ฿{price.toLocaleString()}
          </p>

          <hr className="border-gray-100 mb-6" />

          {product.Option && product.Option.length > 0 && (
            <div className="space-y-5 mb-6">
              {product.Option.map((opt: any) => (
                <div key={opt.id}>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">{opt.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val: any) => {
                      const isSelected = selectedOptions[opt.name] === val.value;
                      return (
                        <button
                          key={val.id}
                          onClick={() => setSelectedOptions(prev => ({ ...prev, [opt.name]: val.value }))}
                          className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#2E4BB1] bg-[#2E4BB1] text-white shadow-md"
                              : "border-gray-200 text-gray-600 hover:border-[#2E4BB1] hover:text-[#2E4BB1]"
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

          <div className="mb-6 bg-gray-50 p-4 rounded-xl">
            <h3 className="text-sm font-bold text-gray-800 mb-1">สถานะคลังสินค้า</h3>
            <p className={`text-sm font-medium ${stock > 0 ? "text-green-600" : "text-red-500"}`}>
              {stock > 0 ? `มีสินค้าพร้อมส่ง (${stock} ชิ้น)` : "สินค้าหมด"}
            </p>
          </div>

          <AddToCart variantId={variantId} stock={stock} price={price} />

        </div>
      </div>
    </div>
  )
}