"use client"

export const dynamic = "force-dynamic";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ShoppingBag, ArrowRight, PackageSearch, Trash2, MapPin, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { useCartStore } from "@/store/cartStore"

export default function CartClient({
  initialItems,
  userProfile
}: {
  initialItems: any[],
  userProfile: { phonenumber: string | null, address: string | null } | null
}) {
  const router = useRouter()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | number | null>(null)

  const hasShippingInfo = Boolean(userProfile?.address && userProfile?.phonenumber)

  if (initialItems.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-6">ตะกร้าสินค้าของคุณยังว่างเปล่า</p>
        <Link href="/user" className="px-6 py-3 bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] text-white rounded-full font-medium hover:opacity-90 transition">
          กลับไปช้อปปิ้ง
        </Link>
      </div>
    )
  }

  const totalAmount = initialItems.reduce((sum, item) => sum + (item.quantity * item.variant.price), 0)

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

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    if (!userProfile?.address || !userProfile?.phonenumber) {
      toast.warning("กรุณากรอกที่อยู่ และเบอร์โทรศัพท์ก่อนสั่งซื้อครับ", { duration: 4000 })
      router.push("/user/profile")
      return
    }

    setIsCheckingOut(true)
    try {
      const res = await fetch("/api/orders", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      toast.success("สั่งซื้อสำเร็จ!", { position: "top-center" })

      useCartStore.setState({ items: [] })

      router.push(`/user/OrderStatue`)
    } catch (error: any) {
      toast.error(error.message)
      setIsCheckingOut(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {initialItems.map((item) => {
          const productImage = item.variant.product.images?.[0]?.url

          return (
            <div key={item.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 relative group">

              <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                {productImage ? (
                  <img src={productImage} alt={item.variant.product.Pname} className="w-full h-full object-cover" />
                ) : (
                  <PackageSearch className="w-8 h-8 text-gray-300" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-gray-800 line-clamp-1">{item.variant.product.Pname}</h3>
                <p className="text-sm text-gray-500 mt-1">ราคา: ฿{item.variant.price.toLocaleString()} / ชิ้น</p>
              </div>


              <div className="text-right mr-12">
                <p className="text-sm text-gray-500 mb-1">จำนวน: {item.quantity}</p>
                <p className="font-bold text-purple-700">฿{(item.variant.price * item.quantity).toLocaleString()}</p>
              </div>

              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={isDeleting === item.id}
                className="absolute right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
                title="ลบสินค้า"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-4">สรุปคำสั่งซื้อ</h3>
        <div className="flex justify-between items-center mb-4 text-gray-600">
          <span>ยอดรวมสินค้า ({initialItems.length} รายการ)</span>
          <span>฿{totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-6 text-gray-600">
          <span>ค่าจัดส่ง</span>
          <span className="text-green-500 font-medium">ฟรี</span>
        </div>
        <div className="flex justify-between items-center mb-6 pt-4 border-t">
          <span className="font-bold text-gray-800">ยอดรวมสุทธิ</span>
          <span className="text-2xl font-bold text-purple-700">฿{totalAmount.toLocaleString()}</span>
        </div>

        {!hasShippingInfo && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 leading-relaxed">
            <span className="font-semibold text-red-700 mr-1">
              <TriangleAlert className="inline size-4 mb-1 mr-1" />ข้อมูลจัดส่งไม่ครบ:
            </span>
            กรุณาเพิ่มที่อยู่และเบอร์โทร
          </div>
        )}

        {hasShippingInfo ? (
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white transition-colors cursor-pointer
              ${isCheckingOut ? 'bg-gray-400' : 'bg-[#2E4BB1] hover:bg-blue-800'}
            `}
          >
            {isCheckingOut ? "กำลังดำเนินการ..." : "ยืนยันการสั่งซื้อ"}
            {!isCheckingOut && <ArrowRight className="w-5 h-5" />}
          </button>
        ) : (
          <Link
            href="/user/Profile"
            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-white bg-red-500 hover:bg-red-600 transition-colors"
          >
            ไปเพิ่มข้อมูลจัดส่ง <MapPin className="w-5 h-5" />
          </Link>
        )}
      </div>
    </div>
  )
}