"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "@/store/cartStore"

export const dynamic = "force-dynamic";

export default function AddToCart({
  variantId,
  stock,
  price
}: {
  variantId: number,
  stock: number,
  price: number
}) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const cartItems = useCartStore((state: any) => state.items) || []

  const quantityInCart = cartItems.find((item: any) => item.variantId === variantId)?.quantity || 0

  const availableStock = stock - quantityInCart

  useEffect(() => {
    if (availableStock <= 0) {
      setQuantity(0)
    } else if (quantity > availableStock) {
      setQuantity(availableStock)
    } else if (quantity === 0 && availableStock > 0) {
      setQuantity(1)
    }
  }, [availableStock, variantId])

  const increase = () => setQuantity(prev => (prev < availableStock ? prev + 1 : prev))
  const decrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1))

  const handleAddToCart = async () => {
    if (availableStock <= 0) return toast.error("คุณเพิ่มสินค้านี้ลงตะกร้าจนครบจำนวนสต๊อกแล้ว!")
    if (quantity <= 0) return toast.error("กรุณาเลือกจำนวนสินค้า")
    if (quantity > availableStock) return toast.error("จำนวนที่เลือกเกินโควต้าที่เหลืออยู่!")

    setIsLoading(true)

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถเพิ่มลงตะกร้าได้")
      }

      const refreshRes = await fetch("/api/cart")
      if (refreshRes.ok) {
        const cartData = await refreshRes.json()
        if (cartData.items) {
          useCartStore.setState({ items: cartData.items })
        }
      }

      toast.success(`เพิ่มลงตะกร้า ${quantity} ชิ้น เรียบร้อย!`, {
        position: "top-center"
      })

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const isOutOfQuota = availableStock <= 0
  const isButtonDisabled = isLoading || isOutOfQuota || stock <= 0

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-gray-700 font-medium">จำนวน:</span>
        <div className={`flex items-center border rounded-lg ${isOutOfQuota ? 'bg-gray-200 border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
          <button 
            onClick={decrease} 
            disabled={isOutOfQuota || quantity <= 1}
            className="p-2 text-gray-500 hover:text-blue-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <span className="w-12 text-center font-semibold text-gray-800">{quantity}</span>
          
          <button 
            onClick={increase} 
            disabled={isOutOfQuota || quantity >= availableStock}
            className="p-2 text-gray-500 hover:text-blue-600 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-col">
           <span className="text-sm text-gray-400">มีสินค้าทั้งหมด {stock} ชิ้น</span>
           {quantityInCart > 0 && (
             <span className="text-xs text-blue-600 font-medium">(อยู่ในตะกร้าแล้ว {quantityInCart} ชิ้น)</span>
           )}
        </div>
      </div>

      <div className="py-2 flex justify-between items-center border-t border-b border-gray-100">
        <span className="text-gray-500 font-medium">ราคารวม:</span>
        <span className="text-2xl font-bold text-purple-700">฿{(price * quantity).toLocaleString()}</span>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={isButtonDisabled}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-all shadow-sm ${
          isOutOfQuota 
            ? 'bg-gray-400 cursor-not-allowed' 
            : isLoading 
              ? 'bg-gray-400 cursor-wait' 
              : 'bg-purple-700 hover:bg-purple-800 cursor-pointer hover:-translate-y-0.5'
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
        {isLoading 
          ? "กำลังเพิ่ม..." 
          : "เพิ่มลงตะกร้า" }
      </button>
    </div>
  )
}