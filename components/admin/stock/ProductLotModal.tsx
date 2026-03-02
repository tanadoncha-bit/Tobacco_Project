"use client"

import { useState, useEffect } from "react"
import { Layers, X } from "lucide-react" // เอาไอคอนที่ไม่ได้ใช้ออกแล้ว

export default function ProductLotModal({
    open,
    productCode,
    productId,
    productName,
    unit,
    onClose
}: {
    open: boolean
    productCode: string
    productId: number | null
    productName: string
    unit: string
    onClose: () => void
}) {
    const [lots, setLots] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const fetchLots = () => {
        if (!productId) return
        setIsLoading(true)
        fetch(`/api/products/${productId}/lots`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setLots(data)
            })
            .catch(err => console.error("Fetch lots error:", err))
            .finally(() => setIsLoading(false))
    }

    useEffect(() => {
        if (open) fetchLots()
        else setLots([])
    }, [open, productId])

    if (!open) return null

    const totalStock = lots.reduce((sum, lot) => sum + (lot.stock ?? 0), 0)

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-purple-50/50">
                    <div className="flex items-center gap-2 text-purple-700">
                        <Layers className="w-5 h-5" />
                        <h2 className="text-lg font-bold">รายละเอียดล๊อต: {productName}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-white p-1.5 rounded-lg transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary */}
                <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <span className="text-sm font-medium text-gray-600">
                        รหัส: <span className="font-bold text-gray-900">{productCode || "-"}</span>
                    </span>
                    <span className="text-sm font-bold px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-700 shadow-sm">
                        ยอดคงเหลือรวม: <span className="text-purple-600 text-base">{totalStock.toLocaleString()}</span> {unit}
                    </span>
                </div>

                {/* Table */}
                <div className="overflow-y-auto p-6 flex-1">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
                    ) : lots.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                            <Layers className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                            <p>ไม่พบข้อมูลล๊อต หรือสินค้าหมดสต๊อก</p>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3">หมายเลข Lot</th>
                                        <th className="px-4 py-3 text-center">คงเหลือ ({unit})</th>
                                        <th className="px-4 py-3 text-right">ต้นทุน/ชิ้น (฿)</th>
                                        <th className="px-4 py-3">วันหมดอายุ</th>
                                        <th className="px-4 py-3">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {lots.map((lot) => {
                                        let statusText = "ปกติ"
                                        let statusClass = "bg-green-50 text-green-700 border-green-200"

                                        if (lot.expireDate) {
                                            const today = new Date()
                                            const expire = new Date(lot.expireDate)
                                            const diffTime = expire.getTime() - today.getTime()
                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                                            if (diffDays <= 0) {
                                                statusText = "หมดอายุแล้ว"
                                                statusClass = "bg-red-50 text-red-700 border-red-200 font-bold"
                                            } else if (diffDays <= 30) {
                                                statusText = `เหลือ ${diffDays} วัน`
                                                statusClass = "bg-orange-50 text-orange-700 border-orange-200 font-bold"
                                            }
                                        } else {
                                            statusText = "ไม่มีวันหมดอายุ"
                                            statusClass = "bg-gray-50 text-gray-600 border-gray-200"
                                        }

                                        return (
                                            <tr key={lot.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-800">{lot.lotNumber}</td>
                                                <td className="px-4 py-3 text-center font-bold text-gray-700">{lot.stock ?? 0}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                                                    {lot.unitCost != null ? lot.unitCost.toLocaleString("th-TH", { minimumFractionDigits: 2 }) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">
                                                    {lot.expireDate ? new Date(lot.expireDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs border ${statusClass}`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}