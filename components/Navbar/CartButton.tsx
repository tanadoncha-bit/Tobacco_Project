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
        className="relative p-2 pb-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
      >
        <ShoppingCart className="size-5 md:size-6" strokeWidth={2.5} />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-rose-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        )}
      </button>

      {/* Hover preview — desktop only */}
      {isHovered && items.length > 0 && (
        <div className="hidden md:block absolute top-full right-0 mt-1 w-[400px] bg-white text-black shadow-2xl border border-gray-100 z-[60] rounded-2xl overflow-hidden cursor-default">
          <div className="text-gray-400 text-sm px-4 py-3 font-medium border-b border-gray-100">
            สินค้าที่เพิ่งเพิ่มเข้าไป
          </div>
          <div className="flex flex-col">
            {displayItems.map((item: any) => {
              const itemName = item.variant?.product?.Pname || item.name || "สินค้า"
              const itemPrice = item.variant?.price || item.price || 0
              const itemImage = item.variant?.product?.images?.[0]?.url || item.image || "https://placehold.co/100x100?text=No+Image"
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 last:border-0">
                  <div className="w-12 h-12 flex-shrink-0 border border-gray-100 rounded-xl overflow-hidden bg-gray-100">
                    <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-gray-700 text-sm flex-1 truncate font-medium" title={itemName}>
                    {itemName}
                  </span>
                  <span className="text-purple-700 text-sm font-black">
                    ฿{(itemPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50 border-t border-gray-100">
            <span className="text-gray-400 text-xs font-medium">
              {remainingItems > 0 ? `+${remainingItems} สินค้าเพิ่มเติม` : ""}
            </span>
            <button
              onClick={() => router.push("/user/ShoppingCart")}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-md hover:shadow-purple-200 hover:-translate-y-0.5 text-white text-sm px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
            >
              ดูรถเข็นของคุณ
            </button>
          </div>
        </div>
      )}
    </div>
  )
}