"use client"

import { useState, useEffect, useRef } from "react"
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

export default function OrderTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [trackingInput, setTrackingInput] = useState("")
  const [isSavingTrack, setIsSavingTrack] = useState(false)

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedOrder) {
      setTrackingInput(selectedOrder.trackingNumber || "")
    }
  }, [selectedOrder])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.status-dropdown')) {
        setOpenDropdownId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "VERIFYING": return "bg-orange-100 text-orange-800"
      case "PAID": return "bg-blue-100 text-blue-800"
      case "SHIPPED": return "bg-purple-100 text-purple-800"
      case "COMPLETED": return "bg-green-100 text-green-800"
      case "CANCELLED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "bg-yellow-400"
      case "VERIFYING": return "bg-orange-400"
      case "PAID": return "bg-blue-400"
      case "SHIPPED": return "bg-purple-400"
      case "COMPLETED": return "bg-green-400"
      case "CANCELLED": return "bg-red-400"
      default: return "bg-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING": return "รอชำระเงิน"
      case "VERIFYING": return "รอตรวจสอบสลิป"
      case "PAID": return "ชำระเงินแล้ว (รอจัดส่ง)"
      case "SHIPPED": return "จัดส่งแล้ว"
      case "COMPLETED": return "เสร็จสิ้น"
      case "CANCELLED": return "ยกเลิก"
      default: return status
    }
  }

  const getAllowedStatuses = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case "PENDING":
        return ["PENDING", "VERIFYING", "PAID", "CANCELLED"]
      case "VERIFYING":
        return ["PENDING", "VERIFYING", "PAID", "CANCELLED"]
      case "PAID":
        return ["PAID", "SHIPPED", "CANCELLED"]
      case "SHIPPED":
        return ["SHIPPED", "COMPLETED", "CANCELLED"]
      case "COMPLETED":
      case "CANCELLED":
        return [currentStatus]
      default:
        return []
    }
  }

  const filteredOrders = orders.filter((order) =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const previousOrders = [...orders]

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
    setOpenDropdownId(null)

    try {
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus }),
      })

      if (!res.ok) throw new Error("อัปเดตไม่สำเร็จ")
      toast.success(`เปลี่ยนสถานะเป็น "${getStatusText(newStatus)}" เรียบร้อย`)
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ")
      setOrders(previousOrders)
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

      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ")

      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, trackingNumber: trackingInput } : o))
      setSelectedOrder({ ...selectedOrder, trackingNumber: trackingInput })
      toast.success("บันทึกเลขพัสดุเรียบร้อยแล้ว")
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกเลขพัสดุ")
    } finally {
      setIsSavingTrack(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 rounded-t-xl">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหาเลขออเดอร์ หรือ ชื่อลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-visible">
          <table className="w-full text-sm text-left w-[1%] whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">เลขออเดอร์</th>
                <th className="px-6 py-4">วันที่สั่งซื้อ</th>
                <th className="px-6 py-4">ลูกค้า</th>
                <th className="px-6 py-4">ยอดรวม</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>{order.orderNumber}</div>
                      {order.trackingNumber && (
                        <div className="text-xs text-purple-600 mt-0.5 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> {order.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-6 py-4">{order.customerName}</td>
                    <td className="px-6 py-4 font-medium text-purple-600">
                      ฿{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} ${order.status === 'VERIFYING' ? 'animate-pulse' : ''}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 w-[1%] whitespace-nowrap">
                      <div className="flex items-center justify-end gap-4">

                        <div className="relative status-dropdown">
                          <button
                            onClick={() => {
                              if (order.status !== "COMPLETED" && order.status !== "CANCELLED") {
                                setOpenDropdownId(openDropdownId === order.id ? null : order.id)
                              }
                            }}
                            className={`flex items-center justify-between gap-2 w-[140px] px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-all shadow-sm cursor-pointer
      ${order.status === "COMPLETED" || order.status === "CANCELLED"
                                ? "opacity-60 cursor-not-allowed bg-gray-50"
                                : "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                              }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${getStatusDotColor(order.status)}`} />
                              <span className="truncate">{STATUS_OPTIONS.find(opt => opt.value === order.status)?.label || order.status}</span>
                            </div>

                            {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${openDropdownId === order.id ? 'rotate-180' : ''}`} />
                            )}
                          </button>

                          {openDropdownId === order.id && (
                            <div className="absolute left-0 mt-1 w-[150px] bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                              {STATUS_OPTIONS
                                .filter(option => getAllowedStatuses(order.status).includes(option.value))
                                .map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(order.id, option.value)}
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors cursor-pointer ${order.status === option.value
                                        ? 'bg-purple-50/50 font-semibold text-purple-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                      }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(option.value)}`} />
                                    {option.label}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedOrder(order)}
                          className='text-gray-400 hover:text-purple-600 p-1 transition-colors cursor-pointer'
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    ไม่พบข้อมูลคำสั่งซื้อ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL รายละเอียดออเดอร์ ================= */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">รายละเอียดคำสั่งซื้อ</h2>
                <p className="text-sm text-gray-500">{selectedOrder.orderNumber}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* ข้อมูลลูกค้า */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ข้อมูลลูกค้า</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                    <span className="font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedOrder.phone}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">ที่อยู่จัดส่ง</h3>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{selectedOrder.address}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.slipImage && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                    <FileImage className="w-4 h-4" /> หลักฐานการโอนเงิน
                  </h3>
                  <div className="bg-white p-2 rounded-md border shadow-inner flex justify-center items-center">
                    <img
                      src={selectedOrder.slipImage}
                      alt="Payment Slip"
                      className="max-h-80 object-contain rounded"
                    />
                  </div>

                  {/* ปุ่มอนุมัติยอดเงิน */}
                  {selectedOrder.status === "VERIFYING" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleStatusChange(selectedOrder.id, "PENDING")}
                        className="flex-1 py-2 bg-white border-2 border-red-500 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 flex justify-center items-center gap-1 transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> สลิปไม่ถูกต้อง
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedOrder.id, "PAID")}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 flex justify-center items-center gap-1 transition shadow-sm cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" /> ยืนยันยอดเงิน
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* กล่องใส่ Tracking Number */}
              {["PAID", "SHIPPED", "COMPLETED"].includes(selectedOrder.status) && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="text-xs font-semibold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> เลขพัสดุ (Tracking Number)
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      placeholder="เช่น TH123456789 (เว้นว่างได้)"
                      className="border border-purple-200 rounded-md px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <button
                      onClick={handleSaveTracking}
                      disabled={isSavingTrack}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isSavingTrack ? "กำลังบันทึก..." : "บันทึกเลขพัสดุ"}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  รายการสินค้า ({selectedOrder.items.length} รายการ)
                </h3>

                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 border rounded-lg items-center bg-white">
                      <div className="w-16 h-16 rounded-md bg-gray-100 border overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{item.productName}</p>
                        {item.variantText && (
                          <p className="text-xs text-gray-500 mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded">
                            {item.variantText}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">฿{item.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">x {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-gray-600 font-medium">ยอดชำระสุทธิ</span>
              <span className="text-xl font-bold text-purple-600">฿{selectedOrder.totalAmount.toLocaleString()}</span>
            </div>

          </div>
        </div>
      )}
    </>
  )
}