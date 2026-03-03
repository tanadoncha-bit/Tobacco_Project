"use client"

import { useCartStore } from "@/store/cartStore"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ShoppingCart } from "lucide-react"

export default function CartButton() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)

  const [isClient, setIsClient] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const syncCartWithDB = async () => {
      try {
        const res = await fetch("/api/cart")
        if (res.ok) {
          const data = await res.json()
          useCartStore.setState({ items: data.items || [] })
        }
      } catch (error) {
        console.error("Sync cart failed:", error)
      }
    }

    syncCartWithDB()
  }, [])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const displayItems = items.slice(0, 5)
  const remainingItems = items.length - displayItems.length

  if (!isClient) return null

  return (
    <div
      className="relative flex items-center py-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => router.push("/user/ShoppingCart")}
        className="relative h-12 w-12 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
      >
        <ShoppingCart className="size-6" strokeWidth={2.5} />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      {isHovered && items.length > 0 && (
        <div className="absolute top-full right-0 mt-1 w-[400px] bg-white text-black shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-100 z-50 rounded-sm cursor-default">

          {/* หัวข้อ */}
          <div className="text-gray-400 text-sm p-3 font-medium">
            สินค้าที่เพิ่งเพิ่มเข้าไป
          </div>

          {/* รายการสินค้า */}
          <div className="flex flex-col">
            {displayItems.map((item: any) => {
              const itemName = item.variant?.product?.Pname || item.name || "สินค้า"
              const itemPrice = item.variant?.price || item.price || 0

              const itemImage = item.variant?.product?.images?.[0]?.url || item.image || "https://placehold.co/100x100?text=No+Image"

              return (
                <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                  {/* รูปภาพ */}
                  <div className="w-12 h-12 flex-shrink-0 border border-gray-200 rounded-sm overflow-hidden bg-gray-100">
                    <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                  </div>

                  {/* ชื่อสินค้า (ใช้ truncate ให้ตัดจบด้วย ... ถ้าชื่อยาวไป) */}
                  <span className="text-gray-700 text-sm flex-1 truncate" title={itemName}>
                    {itemName}
                  </span>

                  {/* ราคา (สีส้ม/แดง แบบในรูป) */}
                  <span className="text-purple-700 text-sm font-medium">
                    ฿{(itemPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ส่วนท้าย (ปุ่ม และ จำนวนที่เหลือ) */}
          <div className="flex justify-between items-center p-3 bg-gray-50/50">
            <span className="text-gray-500 text-xs">
              {remainingItems > 0 ? `${remainingItems} สินค้าเพิ่มเติมในรถเข็น` : ""}
            </span>
            <button
              onClick={() => router.push("/user/ShoppingCart")}
              className="bg-purple-700 hover:bg-purple-800 text-white text-sm px-4 py-2 rounded-sm transition-colors cursor-pointer"
            >
              ดูรถเข็นของคุณ
            </button>
          </div>

        </div>
      )}
    </div>
  )
}