"use client"

import { useState, useEffect } from "react"
import { Eye, Search, X, MapPin, Phone, Package, Truck, FileImage, CheckCircle, XCircle, ChevronDown } from "lucide-react"
import { toast } from "sonner"

type OrderItem = {
  id: number
  productName: string
  imageUrl: string | null
  variantText: string
  price: number
  quantity: number
}

type Order = {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  address: string
  totalAmount: number
  status: string
  createdAt: Date
  trackingNumber: string
  slipImage: string | null
  items: OrderItem[]
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "รอชำระเงิน" },
  { value: "VERIFYING", label: "รอตรวจสอบสลิป" },
  { value: "PAID", label: "ชำระเงินแล้ว" },
  { value: "SHIPPED", label: "จัดส่งแล้ว" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
]

const STATUS_STYLE: Record<string, { badge: string; dot: string; label: string }> = {
  PENDING: { badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400", label: "รอชำระเงิน" },
  VERIFYING: { badge: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400", label: "รอตรวจสอบสลิป" },
  PAID: { badge: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-400", label: "ชำระเงินแล้ว (รอจัดส่ง)" },
  SHIPPED: { badge: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-400", label: "จัดส่งแล้ว" },
  COMPLETED: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400", label: "เสร็จสิ้น" },
  CANCELLED: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-400", label: "ยกเลิก" },
}

const getAllowedStatuses = (currentStatus: string) => {
  switch (currentStatus.toUpperCase()) {
    case "PENDING": return ["PENDING", "VERIFYING", "PAID", "CANCELLED"]
    case "VERIFYING": return ["PENDING", "VERIFYING", "PAID", "CANCELLED"]
    case "PAID": return ["PAID", "SHIPPED", "CANCELLED"]
    case "SHIPPED": return ["SHIPPED", "COMPLETED", "CANCELLED"]
    default: return [currentStatus]
  }
}

export default function OrderTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [trackingInput, setTrackingInput] = useState("")
  const [isSavingTrack, setIsSavingTrack] = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedOrder) setTrackingInput(selectedOrder.trackingNumber || "")
  }, [selectedOrder])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.status-dropdown')) setOpenDropdownId(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === "ALL" || order.status === filterStatus
    return matchSearch && matchStatus
  })

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const prev = [...orders]
    setOrders(o => o.map(x => x.id === orderId ? { ...x, status: newStatus } : x))
    if (selectedOrder?.id === orderId) setSelectedOrder(s => s ? { ...s, status: newStatus } : s)
    setOpenDropdownId(null)
    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      if (!res.ok) throw new Error()
      toast.success(`เปลี่ยนสถานะเป็น "${STATUS_STYLE[newStatus]?.label}" เรียบร้อย`)
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ")
      setOrders(prev)
    }
  }

  const handleSaveTracking = async () => {
    if (!selectedOrder) return
    setIsSavingTrack(true)
    try {
      const res = await fetch("/api/orders/update-tracking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrder.id, trackingNumber: trackingInput }),
      })
      if (!res.ok) throw new Error()
      setOrders(o => o.map(x => x.id === selectedOrder.id ? { ...x, trackingNumber: trackingInput } : x))
      setSelectedOrder({ ...selectedOrder, trackingNumber: trackingInput })
      toast.success("บันทึกเลขพัสดุเรียบร้อยแล้ว")
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึกเลขพัสดุ")
    } finally {
      setIsSavingTrack(false)
    }
  }

  const FILTER_TABS = [
    { value: "ALL", label: "ทั้งหมด", count: orders.length },
    { value: "PENDING", label: "รอชำระ", count: orders.filter(o => o.status === "PENDING").length },
    { value: "VERIFYING", label: "รอตรวจสลิป", count: orders.filter(o => o.status === "VERIFYING").length },
    { value: "PAID", label: "รอจัดส่ง", count: orders.filter(o => o.status === "PAID").length },
    { value: "SHIPPED", label: "จัดส่งแล้ว", count: orders.filter(o => o.status === "SHIPPED").length },
    { value: "COMPLETED", label: "เสร็จสิ้น", count: orders.filter(o => o.status === "COMPLETED").length },
    { value: "CANCELLED", label: "ยกเลิก", count: orders.filter(o => o.status === "CANCELLED").length },
  ]

  const FILTER_ACTIVE: Record<string, string> = {
    ALL: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md",
    PENDING: "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md",
    VERIFYING: "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md",
    PAID: "bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md",
    SHIPPED: "bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-md",
    COMPLETED: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md",
    CANCELLED: "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md",
  }

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100">

        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-wrap gap-3 items-center bg-gray-50/30 rounded-t-3xl justify-between">

          {/* Search */}
          <div className="relative w-64 group shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
            <input
              type="text"
              placeholder="ค้นหาเลขออเดอร์ หรือ ชื่อลูกค้า..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
            />
          </div>

          {/* Filter tabs */}
          <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner flex-wrap gap-1">
            {FILTER_TABS.map(tab => {
              const isActive = filterStatus === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${isActive ? FILTER_ACTIVE[tab.value] : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                    }`}
                >
                  {tab.label}
                  <span className={`py-0.5 px-2 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Table */}
        <div>
          <table className="w-full text-sm text-center whitespace-nowrap" style={{ overflowY: "visible" }}>
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["เลขออเดอร์", "วันที่สั่งซื้อ", "ลูกค้า", "ยอดรวม", "สถานะ", "จัดการ"].map(h => (
                  <th key={h} className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                        <Search className="w-10 h-10 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-lg">ไม่พบข้อมูล</p>
                        <p className="text-gray-400 font-medium mt-1">ไม่มีคำสั่งซื้อที่ตรงกับเงื่อนไข</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const s = STATUS_STYLE[order.status] ?? STATUS_STYLE["PENDING"]
                  const isLocked = ["COMPLETED", "CANCELLED"].includes(order.status)
                  return (
                    <tr key={order.id} className="hover:bg-indigo-50/20 transition-colors group">

                      <td className="px-6 py-4">
                        <div className="font-black text-gray-900 group-hover:text-indigo-700 transition-colors">{order.orderNumber}</div>
                        {order.trackingNumber && (
                          <div className="text-xs text-purple-600 mt-0.5 flex items-center pl-3 gap-1 font-medium">
                            <Truck className="w-3 h-3" /> {order.trackingNumber}
                          </div>
                        )}
                      </td>
                      {/* <td className="px-6 py-5">
                        <p className="font-black text-gray-900 text-base">{item.name}</p>
                        {item.category && (
                          <p className="text-xs font-medium text-gray-500 mt-1 flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            {item.category}
                          </p>
                        )}
                      </td> */}

                      <td className="px-6 py-4 text-gray-500 text-sm font-medium">
                        {new Date(order.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      <td className="px-6 py-4 font-bold text-gray-800">{order.customerName}</td>

                      <td className="px-6 py-4 font-black text-indigo-600 text-base">
                        ฿{order.totalAmount.toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${s.badge} ${order.status === "VERIFYING" ? "animate-pulse" : ""}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {s.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          {/* Status dropdown */}
                          <div className="relative status-dropdown">
                            <button
                              onClick={() => !isLocked && setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                              className={`flex items-center justify-between gap-2 w-[140px] px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 transition-all shadow-sm ${isLocked ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-indigo-300 hover:shadow-md cursor-pointer"
                                }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                                <span className="truncate">{STATUS_OPTIONS.find(o => o.value === order.status)?.label || order.status}</span>
                              </div>
                              {!isLocked && (
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${openDropdownId === order.id ? "rotate-180" : ""}`} />
                              )}
                            </button>

                            {openDropdownId === order.id && (
                              <div className="absolute left-0 mt-1 w-[160px] bg-white border border-gray-100 rounded-xl shadow-xl z-[100] py-1 overflow-hidden">
                                {STATUS_OPTIONS
                                  .filter(opt => getAllowedStatuses(order.status).includes(opt.value))
                                  .map(opt => (
                                    <button
                                      key={opt.value}
                                      onClick={() => handleStatusChange(order.id, opt.value)}
                                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer ${order.status === opt.value
                                        ? "bg-indigo-50 font-bold text-indigo-700"
                                        : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[opt.value]?.dot}`} />
                                      {opt.label}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-md px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            <Eye className="w-4 h-4" /> ดูรายละเอียด
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredOrders.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center rounded-b-3xl">
            <span className="text-sm font-medium text-gray-500">
              แสดงผลทั้งหมด <strong className="text-gray-900">{filteredOrders.length}</strong> รายการ
            </span>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            <div className="px-6 py-5 border-b flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-black text-gray-900">รายละเอียดคำสั่งซื้อ</h2>
                <p className="text-sm text-gray-500 font-medium mt-0.5">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">

              {/* ข้อมูลลูกค้า */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ข้อมูลลูกค้า</p>
                  <p className="font-black text-gray-900">{selectedOrder.customerName}</p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                    <Phone className="w-3.5 h-3.5" /> {selectedOrder.phone}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ที่อยู่จัดส่ง</p>
                  <div className="flex items-start gap-1.5 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" />
                    <span>{selectedOrder.address}</span>
                  </div>
                </div>
              </div>

              {/* สลิป */}
              {selectedOrder.slipImage && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h3 className="text-sm font-black text-gray-900 flex items-center gap-2 mb-3">
                    <FileImage className="w-4 h-4" /> หลักฐานการโอนเงิน
                  </h3>
                  <div className="bg-white p-2 rounded-xl border shadow-inner flex justify-center">
                    <img src={selectedOrder.slipImage} alt="Payment Slip" className="max-h-80 object-contain rounded-lg" />
                  </div>
                  {selectedOrder.status === "VERIFYING" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleStatusChange(selectedOrder.id, "PENDING")}
                        className="flex-1 py-2.5 bg-white border-2 border-rose-400 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 flex justify-center items-center gap-2 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> สลิปไม่ถูกต้อง
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedOrder.id, "PAID")}
                        className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 flex justify-center items-center gap-2 transition shadow-sm cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> ยืนยันยอดเงิน
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tracking */}
              {["PAID", "SHIPPED", "COMPLETED"].includes(selectedOrder.status) && (
                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                  <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> เลขพัสดุ (Tracking Number)
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={e => setTrackingInput(e.target.value)}
                      placeholder="เช่น TH123456789"
                      className="border border-indigo-200 rounded-xl px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
                    />
                    <button
                      onClick={handleSaveTracking}
                      disabled={isSavingTrack}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isSavingTrack ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                  </div>
                </div>
              )}

              {/* รายการสินค้า */}
              <div>
                <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" /> รายการสินค้า ({selectedOrder.items.length} รายการ)
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex gap-4 p-3 border border-gray-100 rounded-xl items-center bg-white shadow-sm">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border overflow-hidden shrink-0">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                        }
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-sm text-gray-900">{item.productName}</p>
                        {item.variantText && (
                          <span className="text-xs text-gray-500 mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded-lg font-medium">
                            {item.variantText}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-gray-900">฿{item.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50/50 flex justify-between items-center">
              <span className="text-gray-500 font-bold text-sm">ยอดชำระสุทธิ</span>
              <span className="text-2xl font-black text-indigo-600">฿{selectedOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}