"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "@/store/cartStore"

export default function AddToCart({ variantId, stock, price }: { variantId: number; stock: number; price: number }) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const cartItems = useCartStore((state: any) => state.items) ?? []
  const quantityInCart  = cartItems.find((item: any) => item.variantId === variantId)?.quantity ?? 0
  const availableStock  = stock - quantityInCart

  useEffect(() => {
    if (availableStock <= 0) setQuantity(0)
    else if (quantity > availableStock) setQuantity(availableStock)
    else if (quantity === 0 && availableStock > 0) setQuantity(1)
  }, [availableStock, variantId])

  const handleAddToCart = async () => {
    if (availableStock <= 0) return toast.error("เพิ่มสินค้าจนครบสต็อกแล้ว")
    if (quantity <= 0)        return toast.error("กรุณาเลือกจำนวน")
    setIsLoading(true)
    try {
      const res = await fetch("/api/cart", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "ไม่สามารถเพิ่มลงตะกร้าได้")
      const refreshRes = await fetch("/api/cart")
      if (refreshRes.ok) {
        const cartData = await refreshRes.json()
        if (cartData.items) useCartStore.setState({ items: cartData.items })
      }
      toast.success(`เพิ่มลงตะกร้า ${quantity} ชิ้น เรียบร้อย!`, { position: "top-center" })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const isDisabled = isLoading || availableStock <= 0 || stock <= 0

  return (
    <div className="space-y-4">

      {/* Quantity selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-gray-700">จำนวน</span>
        <div className={`flex items-center rounded-2xl border-2 overflow-hidden transition-colors ${availableStock <= 0 ? "border-gray-200 bg-gray-50" : "border-gray-200"}`}>
          <button onClick={() => setQuantity(p => p > 1 ? p - 1 : 1)}
            disabled={availableStock <= 0 || quantity <= 1}
            className="px-3 py-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-black text-gray-900 text-sm">{quantity}</span>
          <button onClick={() => setQuantity(p => p < availableStock ? p + 1 : p)}
            disabled={availableStock <= 0 || quantity >= availableStock}
            className="px-3 py-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-medium">สต็อก {stock} ชิ้น</span>
          {quantityInCart > 0 && (
            <span className="text-xs text-purple-600 font-bold">ในตะกร้า {quantityInCart} ชิ้น</span>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center px-4 py-3 bg-purple-50/50 rounded-2xl border border-purple-100">
        <span className="text-sm font-bold text-gray-600">ราคารวม</span>
        <span className="text-2xl font-black text-purple-700">฿{(price * quantity).toLocaleString()}</span>
      </div>

      {/* Button */}
      <button onClick={handleAddToCart} disabled={isDisabled}
        className={`w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-white transition-all shadow-md ${
          isDisabled
            ? "bg-gray-300 cursor-not-allowed shadow-none"
            : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 cursor-pointer"
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
        {isLoading ? "กำลังเพิ่ม..." : availableStock <= 0 ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
      </button>
    </div>
  )
}