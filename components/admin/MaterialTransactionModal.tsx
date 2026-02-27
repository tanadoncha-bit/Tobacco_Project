"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

interface MaterialTransactionModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  material: any // ข้อมูลวัตถุดิบที่ถูกเลือก
}

export default function MaterialTransactionModal({
  open,
  onClose,
  onSuccess,
  material,
}: MaterialTransactionModalProps) {
  const [type, setType] = useState<"IN" | "OUT">("IN")
  const [amount, setAmount] = useState("")
  const [totalCost, setTotalCost] = useState("")
  const [note, setNote] = useState("")

  // รีเซ็ตฟอร์มทุกครั้งที่เปิด Modal ขึ้นมาใหม่
  useEffect(() => {
    if (open) {
      setType("IN")
      setAmount("")
      setTotalCost("")
      setNote("")
    }
  }, [open])

  if (!open || !material) return null

  const handleSubmit = async () => {
    try {
      const numAmount = Number(amount)
      if (!numAmount || numAmount <= 0) {
        toast.error("กรุณาระบุจำนวนให้ถูกต้อง", { position: "top-center" })
        return
      }

      // เช็คสต๊อกก่อนเบิกออก
      if (type === "OUT" && numAmount > material.stock) {
        toast.error("จำนวนที่เบิกออก มากกว่าสต๊อกคงเหลือ!", { position: "top-center" })
        return
      }

      const res = await fetch("/api/materials/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: material.id,
          type,
          amount: numAmount,
          totalCost: totalCost ? Number(totalCost) : null,
          note,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึก", { position: "top-center" })
        return
      }

      toast.success(`ทำรายการ ${type === "IN" ? "รับเข้า" : "เบิกออก"} สำเร็จ!`, { position: "top-center" })
      onSuccess()
      onClose()
    } catch (err) {
      console.error("TRANSACTION ERROR:", err)
      toast.error("ระบบขัดข้อง", { position: "top-center" })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[500px] p-6">
        <h2 className="text-xl font-bold mb-1 text-gray-800">จัดการสต๊อกวัตถุดิบ</h2>
        <p className="text-gray-500 mb-6 text-sm">
          {material.name} (คงเหลือ: {material.stock} {material.unit})
        </p>

        {/* ปุ่มเลือกประเภท รับเข้า / เบิกออก */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setType("IN")}
            className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${
              type === "IN" ? "bg-white shadow text-green-600" : "text-gray-500 hover:text-gray-700 cursor-pointer"
            }`}
          >
            รับเข้า (IN)
          </button>
          <button
            onClick={() => setType("OUT")}
            className={`flex-1 py-2 rounded-md font-medium text-sm transition-all ${
              type === "OUT" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700 cursor-pointer"
            }`}
          >
            เบิกออก (OUT)
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">จำนวน ({material.unit}) *</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* แสดงช่องกรอกราคารวม เฉพาะตอนรับเข้า */}
          {type === "IN" && (
            <div>
              <label className="block text-sm font-medium mb-1">ราคารวมล๊อตนี้ (฿)</label>
              <input
                type="number"
                placeholder="0.00"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                className="w-full px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">ใช้สำหรับบันทึกเป็นรายจ่ายในระบบบัญชี</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">หมายเหตุ (ถ้ามี)</label>
            <textarea
              placeholder={type === "IN" ? "เช่น ซื้อจากร้าน A" : "เช่น เบิกไปผลิตสินค้ารหัส 001"}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border rounded outline-none focus:ring-2 focus:ring-purple-500 resize-none h-20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-lg text-white cursor-pointer ${
              type === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            ยืนยัน{type === "IN" ? "การรับเข้า" : "การเบิกออก"}
          </button>
        </div>
      </div>
    </div>
  )
}