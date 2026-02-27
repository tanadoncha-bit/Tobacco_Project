"use client"

import { useState } from "react"
import { toast } from "sonner"

export default function AddMaterialModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [unit, setUnit] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [stock, setStock] = useState("")

  if (!open) return null

  const handleSubmit = async () => {
    try {
      if (!name.trim()) {
        toast.error("กรุณากรอกชื่อวัตถุดิบ", { position: "top-center" })
        return
      }
      if (!unit.trim()) {
        toast.error("กรุณากรอกหน่วยนับ", { position: "top-center" })
        return
      }

      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          unit,
          costPerUnit: costPerUnit ? Number(costPerUnit) : null,
          stock: stock ? Number(stock) : 0,
        }),
      })

      if (!res.ok) {
        toast.error("เกิดข้อผิดพลาดในการบันทึก", { position: "top-center" })
        return
      }

      toast.success("เพิ่มวัตถุดิบสำเร็จ!", { position: "top-center" })
      
      // ล้างค่าและปิด Modal
      setName("")
      setCode("")
      setUnit("")
      setCostPerUnit("")
      setStock("")
      onSuccess() // เรียก function โหลดข้อมูลใหม่
      onClose()

    } catch (err) {
      console.error("SUBMIT MATERIAL ERROR:", err)
      toast.error("ระบบขัดข้อง", { position: "top-center" })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[500px] p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Add Material (เพิ่มวัตถุดิบ)</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">รหัสวัตถุดิบ (Optional)</label>
            <input
              placeholder="เช่น MAT-001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">ชื่อวัตถุดิบ *</label>
            <input
              placeholder="เช่น ใบยาสูบเกรด A, กระดาษมวน"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">หน่วยนับ *</label>
            <input
              placeholder="เช่น kg, กรัม, ซอง, ม้วน"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">จำนวนเริ่มต้น</label>
              <input
                type="number"
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ต้นทุนเฉลี่ย/หน่วย (฿)</label>
              <input
                type="number"
                placeholder="0.00"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}