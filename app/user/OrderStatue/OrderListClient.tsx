"use client"

import { useState } from "react"
import Link from "next/link"
import { Package, Truck, FileText, CheckCircle2, X, Printer, Upload, CreditCard, Clock, Ban, AlertCircle } from "lucide-react" // 👈 เพิ่มไอคอน Ban
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export const dynamic = "force-dynamic";

// 1. เพิ่ม Type สำหรับตั้งค่าธนาคาร
type PaymentSettings = {
    bankName: string;
    accountNumber: string;
    accountName: string;
}

// 2. รับ Props paymentSettings เข้ามา
export default function OrderListClient({
    orders,
    paymentSettings
}: {
    orders: any[],
    paymentSettings?: PaymentSettings // รับค่าช่องทางชำระเงินจากหน้าตั้งค่า
}) {
    const router = useRouter()
    const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)
    const [slipFile, setSlipFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [cancellingId, setCancellingId] = useState<string | null>(null) // State สำหรับปุ่มยกเลิก
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs sm:text-sm font-bold flex items-center gap-1"><Package className="w-3 h-3 sm:w-4 sm:h-4" /> รอชำระเงิน</span>
            case "PAID":
                return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold flex items-center gap-1"><Package className="w-3 h-3 sm:w-4 sm:h-4" /> ชำระเงินแล้ว</span>
            case "SHIPPED":
                return <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs sm:text-sm font-bold flex items-center gap-1"><Truck className="w-3 h-3 sm:w-4 sm:h-4" /> จัดส่งแล้ว</span>
            case "COMPLETED":
                return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs sm:text-sm font-bold flex items-center gap-1"><Package className="w-3 h-3 sm:w-4 sm:h-4" /> สำเร็จ</span>
            case "CANCELLED":
                return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs sm:text-sm font-bold flex items-center gap-1"><X className="w-3 h-3 sm:w-4 sm:h-4" />ยกเลิกแล้ว</span>
            case "VERIFYING":
                return <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs sm:text-sm font-bold flex items-center gap-1"><Clock className="w-3 h-3 sm:w-4 sm:h-4" />รอตรวจสอบสลิป</span>
            default:
                return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-bold">{status}</span>
        }
    }

    const handlePrint = () => {
        window.print()
    }

    // ฟังก์ชันกดยืนยันใน Modal เพื่อยิง API ยกเลิกจริง
    const executeCancelOrder = async () => {
        if (!confirmCancelId) return;

        setCancellingId(confirmCancelId)
        try {
            const res = await fetch(`/api/orders/${confirmCancelId}/cancel`, {
                method: "PATCH",
            })

            if (!res.ok) throw new Error("ยกเลิกออเดอร์ไม่สำเร็จ")

            toast.success("ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว")
            setConfirmCancelId(null) // ปิด Modal เมื่อเสร็จสิ้น
            router.refresh()
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการยกเลิกออเดอร์")
        } finally {
            setCancellingId(null)
        }
    }

    const handleUploadSlip = async () => {
        if (!slipFile || !selectedReceipt) return

        setIsUploading(true)
        try {
            const formData = new FormData()
            formData.append("file", slipFile)
            formData.append("orderId", selectedReceipt.id)

            const res = await fetch("/api/orders/upload-slip", {
                method: "POST",
                body: formData
            })

            if (!res.ok) throw new Error("อัปโหลดไม่สำเร็จ")

            toast.success("อัปโหลดสลิปสำเร็จ! กรุณารอแอดมินตรวจสอบยอดเงินสักครู่นะครับ")
            setSlipFile(null)
            setSelectedReceipt(null)
            router.refresh()
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการอัปโหลดสลิป")
        } finally {
            setIsUploading(false)
        }
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4 text-lg">คุณยังไม่มีประวัติการสั่งซื้อ</p>
                <Link href="/user">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition">
                        เริ่มช้อปปิ้งเลย
                    </button>
                </Link>
            </div>
        )
    }

    return (
        <>
            {/* ---------------- ส่วนแสดงรายการสั่งซื้อปกติ ---------------- */}
            <div className="space-y-6">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">

                        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-200 gap-4">
                            {/* ... (ข้อมูลส่วนหัวออเดอร์เหมือนเดิม) ... */}
                            <div>
                                <p className="text-xs text-gray-500 font-medium">รหัสคำสั่งซื้อ</p>
                                <p className="font-bold text-gray-800">{`ORD-${order.id.substring(0, 8).toUpperCase()}`}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">วันที่สั่งซื้อ</p>
                                <p className="font-semibold text-gray-800">
                                    {new Date(order.createdAt).toLocaleDateString('th-TH', {
                                        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            {order.trackingNumber && (order.status === "SHIPPED" || order.status === "COMPLETED") && (
                                <div>
                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                        <Truck className="w-3 h-3" /> เลขพัสดุ
                                    </p>
                                    <p className="font-bold text-blue-600">{order.trackingNumber}</p>
                                </div>
                            )}
                            <div>
                                {getStatusBadge(order.status)}
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* ... (รายการสินค้าเหมือนเดิม) ... */}
                            {order.items.map((item: any) => {
                                const variantText = item.variant.values.length > 0
                                    ? item.variant.values.map((v: any) => v.optionValue.value).join(" | ")
                                    : "สินค้าปกติ"

                                return (
                                    <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800">{item.variant.product.Pname}</h4>
                                            {variantText !== "สินค้าปกติ" && (
                                                <p className="text-sm text-gray-500">{variantText}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">จำนวน: {item.quantity}</p>
                                            <p className="font-semibold text-gray-800">฿{(item.price * item.quantity).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* การ์ด Footer (เพิ่มปุ่มยกเลิก) */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        setSelectedReceipt(order)
                                        setSlipFile(null)
                                    }}
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors cursor-pointer"
                                >
                                    <FileText className="w-4 h-4" /> ดูใบเสร็จ
                                </button>

                                {/* 3. ปุ่มลูกค้ายกเลิกออเดอร์เอง (แสดงเฉพาะตอน PENDING) */}
                                {order.status === "PENDING" && (
                                    <button
                                        onClick={() => setConfirmCancelId(order.id)} // 👈 เปลี่ยนเป็นเซ็ต State เพื่อเปิด Modal
                                        disabled={cancellingId === order.id}
                                        className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <Ban className="w-4 h-4" />
                                        {cancellingId === order.id ? "กำลังยกเลิก..." : "ยกเลิกคำสั่งซื้อ"}
                                    </button>
                                )}
                            </div>

                            <div className="text-right">
                                <span className="text-sm text-gray-500 mr-2">ยอดรวมสุทธิ:</span>
                                <span className="text-xl font-bold text-blue-600">฿{order.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                    </div>
                ))}
            </div>

            {/* ---------------- ส่วนของ MODAL ใบเสร็จ ---------------- */}
            {selectedReceipt && (
                <>
                    {/* ... (Style และ Modal Header เหมือนเดิม) ... */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:bg-transparent print:p-0">
                        <div id="receipt-modal" className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-w-full print:max-h-none print:overflow-visible print:w-full print:rounded-none relative">
                            {/* ... (ปุ่ม X และข้อมูลผู้ซื้อ เหมือนเดิม) ... */}

                            <div className="p-8">
                                {/* หัวใบเสร็จ */}
                                <div className="flex flex-col items-center text-center border-b pb-6 mb-6">
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                                    <h2 className="text-3xl font-bold text-gray-800">คำสั่งซื้อของคุณ</h2>
                                    <p className="text-sm text-gray-400 mt-1">
                                        รหัสคำสั่งซื้อ: {selectedReceipt.id.split("-")[0].toUpperCase()}
                                    </p>
                                </div>
                                {/* ... (ข้อมูลการจัดส่ง เหมือนเดิม) ... */}

                                {/* กล่องอัปโหลดสลิปและการชำระเงิน */}
                                {selectedReceipt.status === "PENDING" && (
                                    <div className="mb-8 border border-blue-200 bg-blue-50/50 rounded-xl p-6 print:hidden">
                                        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                            <CreditCard /> ช่องทางการชำระเงิน
                                        </h3>

                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-xl">
                                                    ฿
                                                </div>
                                                <div>
                                                    {/* 4. ดึงข้อมูลจาก props paymentSettings ตรงนี้ */}
                                                    <p className="text-sm text-gray-500">{paymentSettings?.bankName || "ธนาคารกสิกรไทย (ค่าเริ่มต้น)"}</p>
                                                    <p className="text-lg font-mono font-bold text-gray-800 tracking-wider">
                                                        {paymentSettings?.accountNumber || "123-4-56789-0"}
                                                    </p>
                                                    <p className="text-sm text-gray-700">ชื่อบัญชี: {paymentSettings?.accountName || "บจก. โทแบคโค สโตร์"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ... (ช่องอัปโหลดไฟล์ เหมือนเดิม) ... */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium text-gray-700">อัปโหลดหลักฐานการโอนเงิน (สลิป)</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => setSlipFile(e.target.files?.[0] || null)}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                                            />
                                            <button
                                                onClick={handleUploadSlip}
                                                disabled={!slipFile || isUploading}
                                                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                                            >
                                                <Upload className="w-4 h-4" />
                                                {isUploading ? "กำลังอัปโหลด..." : "แจ้งชำระเงิน"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">รายการสินค้า</h3>
                                <div className="space-y-4 mb-6">
                                    {selectedReceipt.items.map((item: any) => {
                                        const variantText = item.variant.values.length > 0
                                            ? item.variant.values.map((v: any) => v.optionValue.value).join(" | ")
                                            : null

                                        return (
                                            <div key={item.id} className="flex justify-between items-center text-sm">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{item.variant.product.Pname}</p>
                                                    {variantText && (
                                                        <p className="text-xs text-gray-500">{variantText}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">฿{(item.price * item.quantity).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="border-t pt-4 border-b pb-8 print:border-b-0 print:pb-0 mb-6">
                                    <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                                        <span>ยอดที่ต้องชำระ</span>
                                        <span className="text-blue-600 text-2xl">฿{selectedReceipt.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex justify-center gap-4 print:hidden">
                                    <button
                                        onClick={handlePrint}
                                        className="flex items-center gap-2 bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition cursor-pointer"
                                    >
                                        <Printer className="w-5 h-5" /> พิมพ์ใบเสร็จ
                                    </button>
                                    <button
                                        onClick={() => setSelectedReceipt(null)}
                                        className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                                    >
                                        ปิด
                                    </button>
                                </div>

                            </div>
                        </div>
                    </div>

                </>
            )}
            {/* ---------------- ส่วนของ MODAL ยืนยันการยกเลิก ---------------- */}
            {confirmCancelId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            {/* ไอคอนแจ้งเตือน */}
                            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการยกเลิก</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคำสั่งซื้อนี้? <br />
                                <span className="text-red-500 font-medium">หากยกเลิกแล้วจะไม่สามารถย้อนกลับได้</span>
                            </p>

                            {/* ปุ่มกดยืนยัน / ยกเลิก */}
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setConfirmCancelId(null)}
                                    disabled={cancellingId !== null}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    กลับ
                                </button>
                                <button
                                    onClick={executeCancelOrder}
                                    disabled={cancellingId !== null}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all shadow-sm shadow-red-200 disabled:bg-red-400 flex justify-center items-center gap-2 cursor-pointer"
                                >
                                    {cancellingId ? (
                                        <>
                                            {/* Loading Spinner แบบ CSS */}
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            กำลังยกเลิก...
                                        </>
                                    ) : "ยืนยันยกเลิก"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}