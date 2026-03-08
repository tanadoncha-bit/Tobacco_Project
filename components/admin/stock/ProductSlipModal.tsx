"use client"

import { X, History } from "lucide-react"
import { useEffect, useState } from "react"

type ProductSlipModalProps = {
  productId: number | null
  productName: string
  open: boolean
  onClose: () => void
}

export default function ProductSlipModal({ productId, productName, open, onClose }: ProductSlipModalProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && productId) {
      setIsLoading(true)
      fetch(`/api/products/transactions/${productId}`)
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาด")
          return data
        })
        .then((data) => {
          setTransactions(Array.isArray(data) ? data : [])
        })
        .catch((err) => {
          console.error("โหลดประวัติไม่สำเร็จ:", err)
          setTransactions([])
        })
        .finally(() => setIsLoading(false))
    } else {
      setTransactions([])
    }
  }, [open, productId])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-xl">

        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <History className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold">ประวัติสต๊อกสินค้า: <span className="text-blue-600">{productName}</span></h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">ยังไม่มีประวัติการเข้า-ออกของสต๊อก</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 border-b">วัน-เวลา</th>
                    <th className="px-4 py-3 border-b">ตัวเลือกสินค้า</th>
                    <th className="px-4 py-3 border-b">ประเภท</th>
                    <th className="px-4 py-3 border-b text-right">จำนวน</th>
                    <th className="px-4 py-3 border-b">หมายเหตุ</th>
                    <th className="px-4 py-3 border-b">ผู้ทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(transactions || []).map((txn, index) => {
                    const variantName = txn.variant?.values?.map((v: any) => v.optionValue.value).join(", ") || "ไม่มีตัวเลือก"

                    return (
                      <tr key={txn.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {new Date(txn.createdAt).toLocaleString('th-TH', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{variantName}</td>
                        <td className="px-4 py-3">
                          {(() => {
                            const reason = txn.reason
                            const type = txn.type

                            const map: Record<string, { label: string, class: string }> = {
                              NEW_PURCHASE: { label: "รับเข้าซื้อ", class: "bg-green-100 text-green-700" },
                              PRODUCTION: { label: "รับจากผลิต", class: "bg-blue-100 text-blue-700" },
                              RETURN: { label: "ลูกค้าคืน", class: "bg-purple-100 text-purple-700" },
                              AUDIT: { label: "ปรับยอด", class: "bg-gray-100 text-gray-700" },
                              SALE: { label: "ขายออก", class: "bg-orange-100 text-orange-700" },
                              DAMAGED: { label: "ของชำรุด", class: "bg-red-100 text-red-600" },
                              EXPIRED: { label: "หมดอายุ", class: "bg-red-200 text-red-800" },
                            }

                            const display = map[reason] ?? {
                              label: type?.includes("IN") ? "รับเข้า" : "เบิกออก",
                              class: type?.includes("IN") ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }

                            return (
                              <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${display.class}`}>
                                {display.label}
                              </span>
                            )
                          })()}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${txn.type?.includes("IN") ? "text-green-600" : "text-orange-600"}`}>
                          {txn.type?.includes("IN") ? "+" : "-"}{txn.amount}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{txn.note || "-"}</td>
                        <td className="px-4 py-3 text-gray-600">{txn.profile ? `${txn.profile.firstname} ${txn.profile.lastname}` : "System"}</td>
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