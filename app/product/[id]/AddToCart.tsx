export const dynamic = "force-dynamic";

"use client"

import { useState } from "react"
import { ShoppingCart, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { useCartStore } from "@/store/cartStore"

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

  // ฟังก์ชันเพิ่ม/ลด จำนวน
  const increase = () => setQuantity(prev => (prev < stock ? prev + 1 : prev))
  const decrease = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1))

  // ฟังก์ชันกดเพิ่มลงตะกร้า
  const handleAddToCart = async () => {
    if (stock <= 0) return toast.error("สินค้าหมด!")
    setIsLoading(true)

    try {
      // 🚀 1. ยิง API เพื่อบันทึกสินค้าลง Database (ของเดิมของคุณ)
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, quantity })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถเพิ่มลงตะกร้าได้")
      }

      // 🚀 2. ดึงข้อมูลตะกร้าล่าสุดจาก Database เพื่อเอามาอัปเดตหน้าจอทันที!
      const refreshRes = await fetch("/api/cart")
      if (refreshRes.ok) {
        const cartData = await refreshRes.json()

        console.log("ตะกร้าใหม่ที่ได้จาก API:", cartData)

        if (cartData.items) {
          // 🚨 ทริคเด็ด: ใช้ setState เพื่อยัดข้อมูลเข้า Zustand โดยตรง (จุดแดงและ Popup จะเด้งทันที!)
          useCartStore.setState({ items: cartData.items })
          console.log("อัปเดต Zustand สำเร็จ!")
        } else {
           console.log("API ไม่ได้ส่ง items กลับมาให้:", cartData)
        }
      }

      // ถ้าสำเร็จ แจ้งเตือนลูกค้าสวยๆ
      toast.success(`เพิ่มลงตะกร้า ${quantity} ชิ้น เรียบร้อย!`, {
        position: "top-center"
      })

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {/* ตัวปรับจำนวน */}
      <div className="flex items-center gap-4">
        <span className="text-gray-700 font-medium">จำนวน:</span>
        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
          <button onClick={decrease} className="p-2 text-gray-500 hover:text-blue-600 transition cursor-pointer">
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-semibold text-gray-800">{quantity}</span>
          <button onClick={increase} className="p-2 text-gray-500 hover:text-blue-600 transition cursor-pointer">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <span className="text-sm text-gray-400">มีสินค้าทั้งหมด {stock} ชิ้น</span>
      </div>

      {/* ราคารวม (คำนวณตามจำนวน) */}
      <div className="py-2 flex justify-between items-center border-t border-b border-gray-100">
        <span className="text-gray-500 font-medium">ราคารวม:</span>
        <span className="text-2xl font-bold text-purple-700">฿{(price * quantity).toLocaleString()}</span>
      </div>

      {/* ปุ่ม Add to Cart */}
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-colors shadow-sm cursor-pointer ${
          isLoading ? 'bg-gray-400' : 'bg-purple-700 hover:bg-purple-800'
        }`}
      >
        <ShoppingCart className="w-5 h-5" />
        {isLoading ? "กำลังเพิ่ม..." : "เพิ่มลงตะกร้า"}
      </button>
    </div>
  )
}