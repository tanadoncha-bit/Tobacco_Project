"use client"

import { X, History } from "lucide-react"
import { useEffect, useState } from "react"

type Transaction = {
  id: number
  type: "IN" | "OUT"
  amount: number
  note: string | null
  createdAt: string
  profile: { firstname: string; lastname: string } | null
}

type MaterialHistoryModalProps = {
  materialId: number | null
  materialName: string
  open: boolean
  onClose: () => void
}

export default function MaterialHistoryModal({ materialId, materialName, open, onClose }: MaterialHistoryModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !materialId) {
      setTransactions([])
      return
    }

    const controller = new AbortController()

    setIsLoading(true)
    fetch(`/api/materials/${materialId}/transactions`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "เกิดข้อผิดพลาดในการดึงข้อมูล")
        return data
      })
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (err.name === "AbortError") return // ปิด modal ระหว่างโหลด ไม่ต้อง error
        console.error("โหลดประวัติไม่สำเร็จ:", err)
        setTransactions([])
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort() // cleanup เมื่อ modal ปิดหรือ materialId เปลี่ยน
  }, [open, materialId])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-xl">

        {/* ส่วนหัว */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <History className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold">ประวัติวัตถุดิบ: <span className="text-blue-600">{materialName}</span></h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ส่วนเนื้อหา (ตาราง) */}
        <div className="p-5 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">ยังไม่มีประวัติการใช้งานวัตถุดิบนี้</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 border-b">วัน-เวลา</th>
                    <th className="px-4 py-3 border-b">ประเภท</th>
                    <th className="px-4 py-3 border-b text-right">จำนวน</th>
                    <th className="px-4 py-3 border-b">หมายเหตุ</th>
                    <th className="px-4 py-3 border-b">ผู้ทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((txn, index) => (
                    <tr key={txn.id ?? index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(txn.createdAt).toLocaleString("th-TH", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                          txn.type === "IN" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {txn.type === "IN" ? "รับเข้า (IN)" : "เบิกออก (OUT)"}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${
                        txn.type === "IN" ? "text-green-600" : "text-orange-600"
                      }`}>
                        {txn.type === "IN" ? "+" : "-"}{txn.amount}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{txn.note ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {txn.profile ? `${txn.profile.firstname} ${txn.profile.lastname}` : "System"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}