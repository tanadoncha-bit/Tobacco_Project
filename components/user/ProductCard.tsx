"use client"

import { useState } from "react"
import { useCartStore } from "@/store/cartStore"
import { toast } from "sonner"

export default function ProductCard({ product }: { product: any }) {
  const addItem = useCartStore((state) => state.addItem)
  
  const [selectedVariantId, setSelectedVariantId] = useState<number | string>(
    product.variants?.length > 0 ? product.variants[0].id : ""
  )

  const selectedVariant = product.variants?.find((v: any) => v.id === Number(selectedVariantId))
  const defaultImage = product.images?.[0]?.url || ""

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error("กรุณาเลือกรูปแบบสินค้า")
      return
    }

    if (selectedVariant.stock <= 0) {
      toast.error("สินค้าหมด!")
      return
    }

    addItem({
      variantId: selectedVariant.id,
      name: product.Pname,
      variantName: `สี: ${selectedVariant.color} | ไซส์: ${selectedVariant.size}`,
      price: selectedVariant.price,
      quantity: 1,
      imageUrl: defaultImage,
    })

    toast.success(`เพิ่ม ${product.Pname} ลงตะกร้าแล้ว!`, { position: "top-center" })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* รูปภาพสินค้า */}
      <div className="aspect-square bg-gray-100 relative">
        {defaultImage ? (
          <img src={defaultImage} alt={product.Pname} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            ไม่มีรูปภาพ
          </div>
        )}
        
        {/* ป้าย Out of stock */}
        {selectedVariant?.stock <= 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            สินค้าหมด
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800 truncate">{product.Pname}</h3>
        <p className="text-gray-500 text-sm mb-4 truncate">รหัส: {product.productCode || "-"}</p>

        {/* ตัวเลือก Variant (สี/ไซส์) */}
        {product.variants?.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">เลือกรูปแบบ:</label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-lg p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 border"
            >
              {product.variants.map((v: any) => (
                <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                  {v.color} - {v.size} {v.stock <= 0 ? "(หมด)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="font-bold text-xl text-blue-600">
            ฿{selectedVariant ? selectedVariant.price.toLocaleString() : "0"}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock <= 0}
            className="bg-[linear-gradient(140deg,#2F4156,#567C8D)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            หยิบใส่ตะกร้า
          </button>
        </div>
      </div>
    </div>
  )
}