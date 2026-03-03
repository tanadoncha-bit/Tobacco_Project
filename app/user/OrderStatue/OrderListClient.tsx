"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Package, Truck, FileText, CheckCircle2, X, Printer,
  Upload, CreditCard, Clock, Ban, AlertCircle, PackageSearch,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type PaymentSettings = {
  bankName: string
  accountNumber: string
  accountName: string
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: any }> = {
  PENDING:    { label: "รอชำระเงิน",       className: "bg-amber-50 text-amber-700 border-amber-200",   icon: Clock },
  VERIFYING:  { label: "รอตรวจสอบสลิป",   className: "bg-orange-50 text-orange-700 border-orange-200", icon: Clock },
  PAID:       { label: "ชำระเงินแล้ว",     className: "bg-blue-50 text-blue-700 border-blue-200",       icon: Package },
  SHIPPED:    { label: "จัดส่งแล้ว",       className: "bg-purple-50 text-purple-700 border-purple-200", icon: Truck },
  COMPLETED:  { label: "สำเร็จ",           className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  CANCELLED:  { label: "ยกเลิกแล้ว",      className: "bg-rose-50 text-rose-600 border-rose-200",       icon: X },
}

export default function OrderListClient({
  orders,
  paymentSettings,
}: {
  orders: any[]
  paymentSettings?: PaymentSettings
}) {
  const router = useRouter()
  const [selectedReceipt, setSelectedReceipt]   = useState<any | null>(null)
  const [slipFile, setSlipFile]                 = useState<File | null>(null)
  const [isUploading, setIsUploading]           = useState(false)
  const [cancellingId, setCancellingId]         = useState<string | null>(null)
  const [confirmCancelId, setConfirmCancelId]   = useState<string | null>(null)

  const executeCancelOrder = async () => {
    if (!confirmCancelId) return
    setCancellingId(confirmCancelId)
    try {
      const res = await fetch(`/api/orders/${confirmCancelId}/cancel`, { method: "PATCH" })
      if (!res.ok) throw new Error()
      toast.success("ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว")
      setConfirmCancelId(null)
      router.refresh()
    } catch { toast.error("เกิดข้อผิดพลาดในการยกเลิกออเดอร์") }
    finally { setCancellingId(null) }
  }

  const handleUploadSlip = async () => {
    if (!slipFile || !selectedReceipt) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", slipFile)
      formData.append("orderId", selectedReceipt.id)
      const res = await fetch("/api/orders/upload-slip", { method: "POST", body: formData })
      if (!res.ok) throw new Error()
      toast.success("อัปโหลดสลิปสำเร็จ! กรุณารอแอดมินตรวจสอบ")
      setSlipFile(null)
      setSelectedReceipt(null)
      router.refresh()
    } catch { toast.error("เกิดข้อผิดพลาดในการอัปโหลดสลิป") }
    finally { setIsUploading(false) }
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
        <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50 mb-4">
          <PackageSearch className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-gray-900 font-bold text-lg">ยังไม่มีประวัติการสั่งซื้อ</p>
        <p className="text-gray-400 font-medium text-sm mt-1 mb-6">เริ่มช้อปปิ้งและสั่งซื้อสินค้าได้เลย</p>
        <Link href="/user">
          <button className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
            เริ่มช้อปปิ้งเลย
          </button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {orders.map(order => {
          const statusInfo = STATUS_BADGE[order.status]
          const StatusIcon = statusInfo?.icon ?? Package
          return (
            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">รหัสคำสั่งซื้อ</p>
                    <p className="font-extrabold text-gray-900 text-sm">ORD-{order.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">วันที่สั่งซื้อ</p>
                    <p className="font-bold text-gray-700 text-sm">
                      {new Date(order.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {order.trackingNumber && ["SHIPPED","COMPLETED"].includes(order.status) && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Truck className="w-3 h-3" /> เลขพัสดุ</p>
                      <p className="font-black text-purple-600 text-sm">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${statusInfo?.className}`}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {statusInfo?.label ?? order.status}
                </span>
              </div>

              {/* Items */}
              <div className="p-5 space-y-3">
                {order.items.map((item: any) => {
                  const variantText = item.variant.values?.length > 0
                    ? item.variant.values.map((v: any) => v.optionValue.value).join(" | ")
                    : null
                  const imageUrl = item.variant?.product?.images?.[0]?.url ?? null
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                        {imageUrl
                          ? <img src={imageUrl} alt={item.variant.product.Pname} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-900 text-sm truncate">{item.variant.product.Pname}</p>
                        {variantText && <p className="text-xs text-gray-400 font-medium mt-0.5">{variantText}</p>}
                        <p className="text-xs text-gray-500 font-medium mt-0.5">x{item.quantity}</p>
                      </div>
                      <p className="font-black text-gray-900 text-sm shrink-0">฿{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  )
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => { setSelectedReceipt(order); setSlipFile(null) }}
                    className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-bold transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> ดูใบเสร็จ
                  </button>
                  {order.status === "PENDING" && (
                    <button
                      onClick={() => setConfirmCancelId(order.id)}
                      disabled={cancellingId === order.id}
                      className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-600 font-bold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      {cancellingId === order.id ? "กำลังยกเลิก..." : "ยกเลิก"}
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 font-medium">ยอดรวมสุทธิ</span>
                  <p className="text-xl font-black text-purple-700">฿{order.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-5">

              {/* Header */}
              <div className="flex flex-col items-center text-center border-b border-gray-100 pb-5">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-purple-200 mb-3">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">คำสั่งซื้อของคุณ</h2>
                <p className="text-sm text-gray-400 font-medium mt-1">
                  ORD-{selectedReceipt.id.substring(0, 8).toUpperCase()}
                </p>
              </div>

              {/* Payment section */}
              {selectedReceipt.status === "PENDING" && (
                <div className="border border-purple-100 bg-purple-50/30 rounded-2xl p-5 space-y-4">
                  <h3 className="font-black text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-purple-600" /> ช่องทางการชำระเงิน
                  </h3>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center font-black text-xl">฿</div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{paymentSettings?.bankName}</p>
                      <p className="font-black text-gray-900 tracking-wider">{paymentSettings?.accountNumber}</p>
                      <p className="text-sm text-gray-600 font-medium">{paymentSettings?.accountName}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">อัปโหลดสลิปการโอนเงิน</p>
                    <label className="flex items-center gap-2 cursor-pointer bg-white border-2 border-dashed border-purple-200 rounded-2xl px-4 py-3 hover:border-purple-400 transition-colors">
                      <Upload className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-600 truncate">
                        {slipFile ? slipFile.name : "เลือกไฟล์สลิป..."}
                      </span>
                      <input type="file" accept="image/*" onChange={e => setSlipFile(e.target.files?.[0] || null)} className="hidden" />
                    </label>
                    <button
                      onClick={handleUploadSlip}
                      disabled={!slipFile || isUploading}
                      className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-2xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? "กำลังอัปโหลด..." : "แจ้งชำระเงิน"}
                    </button>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-black text-gray-900 mb-3">รายการสินค้า</h3>
                <div className="space-y-3">
                  {selectedReceipt.items.map((item: any) => {
                    const variantText = item.variant.values?.length > 0
                      ? item.variant.values.map((v: any) => v.optionValue.value).join(" | ")
                      : null
                    return (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.variant.product.Pname}</p>
                          {variantText && <p className="text-xs text-gray-400">{variantText}</p>}
                          <p className="text-xs text-gray-400">x{item.quantity}</p>
                        </div>
                        <p className="font-black text-gray-900">฿{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl px-5 py-4">
                <span className="font-bold text-gray-700">ยอดที่ต้องชำระ</span>
                <span className="text-2xl font-black text-purple-700">฿{selectedReceipt.totalAmount.toLocaleString()}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-2xl hover:border-purple-300 hover:text-purple-600 transition-all cursor-pointer">
                  <Printer className="w-4 h-4" /> พิมพ์ใบเสร็จ
                </button>
                <button onClick={() => setSelectedReceipt(null)}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer">
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-rose-50 p-4 rounded-full ring-8 ring-rose-50/50 mb-4">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการยกเลิก</h3>
              <p className="text-sm text-gray-500 font-medium mb-6">
                คุณแน่ใจหรือไม่? <span className="text-rose-500 font-bold">ไม่สามารถย้อนกลับได้</span>
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setConfirmCancelId(null)} disabled={cancellingId !== null}
                  className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer">
                  กลับ
                </button>
                <button onClick={executeCancelOrder} disabled={cancellingId !== null}
                  className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-md shadow-rose-200 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer">
                  {cancellingId ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />ยกเลิก...</> : "ยืนยัน"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}