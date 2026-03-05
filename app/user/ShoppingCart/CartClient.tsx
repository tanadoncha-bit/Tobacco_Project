"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ShoppingBag, ArrowRight, PackageSearch, Trash2, MapPin, TriangleAlert, Package } from "lucide-react"
import Link from "next/link"
import { useCartStore } from "@/store/cartStore"

export default function CartClient({
  initialItems,
  userProfile,
}: {
  initialItems: any[]
  userProfile: { phonenumber: string | null; address: string | null } | null
}) {
  const router = useRouter()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isDeleting, setIsDeleting]       = useState<string | number | null>(null)
  const hasShippingInfo = Boolean(userProfile?.address && userProfile?.phonenumber)

  if (initialItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
        <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50 mb-4">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-gray-900 font-bold text-lg">ตะกร้าสินค้าว่างเปล่า</p>
        <p className="text-gray-400 font-medium text-sm mt-1 mb-6">เพิ่มสินค้าที่ต้องการลงตะกร้าได้เลย</p>
        <Link href="/user" className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
          กลับไปช้อปปิ้ง
        </Link>
      </div>
    )
  }

  const totalAmount = initialItems.reduce((sum, item) => sum + item.quantity * item.variant.price, 0)

  const handleRemoveItem = async (cartItemId: string) => {
    setIsDeleting(cartItemId)
    try {
      const res = await fetch(`/api/cart?itemId=${cartItemId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("ลบสินค้าไม่สำเร็จ")
      const refreshRes = await fetch("/api/cart")
      if (refreshRes.ok) {
        const cartData = await refreshRes.json()
        useCartStore.setState({ items: cartData.items || [] })
      }
      toast.success("ลบสินค้าเรียบร้อย")
      router.refresh()
    } catch (error: any) { toast.error(error.message) }
    finally { setIsDeleting(null) }
  }

  const handleCheckout = async () => {
    if (!userProfile?.address || !userProfile?.phonenumber) {
      toast.warning("กรุณากรอกที่อยู่และเบอร์โทรก่อนสั่งซื้อ", { duration: 4000 })
      router.push("/user/profile")
      return
    }
    setIsCheckingOut(true)
    try {
      const res  = await fetch("/api/orders", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("สั่งซื้อสำเร็จ!", { position: "top-center" })
      useCartStore.setState({ items: [] })
      router.push("/user/OrderStatue")
    } catch (error: any) {
      toast.error(error.message)
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Items */}
      <div className="lg:col-span-2 space-y-3">
        {initialItems.map(item => {
          const imageUrl    = item.variant.product.images?.[0]?.url ?? null
          const variantText = item.variant.values?.length > 0
            ? item.variant.values.map((v: any) => v.optionValue.value).join(" | ")
            : null
          return (
            <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                {imageUrl
                  ? <img src={imageUrl} alt={item.variant.product.Pname} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 truncate">{item.variant.product.Pname}</p>
                {variantText && <p className="text-xs text-gray-400 font-medium mt-0.5">{variantText}</p>}
                <p className="text-sm text-gray-500 font-medium mt-1">฿{item.variant.price.toLocaleString()} / ชิ้น × {item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-purple-700 text-lg">฿{(item.variant.price * item.quantity).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={isDeleting === item.id}
                className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-fit sticky top-24 space-y-4">
        <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-4">สรุปคำสั่งซื้อ</h3>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>ยอดรวม ({initialItems.length} รายการ)</span>
            <span>฿{totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-gray-600">
            <span>ค่าจัดส่ง</span>
            <span className="text-emerald-600 font-bold">ฟรี</span>
          </div>
        </div>

        <div className="flex justify-between items-center border-t border-gray-100 pt-4">
          <span className="font-black text-gray-900">ยอดรวมสุทธิ</span>
          <span className="text-2xl font-black text-purple-700">฿{totalAmount.toLocaleString()}</span>
        </div>

        {!hasShippingInfo && (
          <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-2xl border border-rose-100 font-medium">
            <TriangleAlert className="inline w-4 h-4 mb-0.5 mr-1" />
            กรุณาเพิ่มที่อยู่และเบอร์โทรก่อนสั่งซื้อ
          </div>
        )}

        {hasShippingInfo ? (
          <button onClick={handleCheckout} disabled={isCheckingOut}
            className={`w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-white transition-all shadow-md cursor-pointer ${
              isCheckingOut
                ? "bg-gray-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5"
            }`}
          >
            {isCheckingOut ? "กำลังดำเนินการ..." : <><span>ยืนยันการสั่งซื้อ</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        ) : (
          <Link href="/user/Profile"
            className="w-full py-3.5 rounded-2xl font-black flex items-center justify-center gap-2 text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-md">
            ไปเพิ่มข้อมูลจัดส่ง <MapPin className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}