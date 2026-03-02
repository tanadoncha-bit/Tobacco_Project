"use client"

import { useState, useEffect } from "react"
import { X, ArrowUpFromLine, Package, ChevronDown, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

type ProductLot = {
  id: number
  lotNumber: string
  stock: number
  expireDate?: string | null
}

type Props = {
  open: boolean
  productId: number
  productName: string
  onClose: () => void
  onSuccess: () => void
}

export default function DispatchProductModal({ open, productId, productName, onClose, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [lots, setLots] = useState<ProductLot[]>([])

  const [isLotDropdownOpen, setIsLotDropdownOpen] = useState(false)
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false)

  const [form, setForm] = useState({
    amount: "",
    lotId: "",
    reason: "SALE",
    note: ""
  })

  useEffect(() => {
    if (open && productId) {
      const fetchLots = async () => {
        try {
          const res = await fetch(`/api/products/${productId}/lots`)
          if (res.ok) {
            const data = await res.json()
            setLots(Array.isArray(data) ? data : [])
          }
        } catch (error) {
          console.error("Failed to fetch lots:", error)
        }
      }
      fetchLots()

      setForm({ amount: "", lotId: "", reason: "SALE", note: "" })
      setIsLotDropdownOpen(false)
      setIsReasonDropdownOpen(false)
    }
  }, [open, productId])

  if (!open) return null

  const availableLots = lots.filter(lot => {
    if (Number(lot.stock) <= 0) return false;

    // ถ้าเลือกตัด "สินค้าหมดอายุ" ให้เช็คว่าเลยวันรึยัง
    if (form.reason === "EXPIRED") {
      if (!lot.expireDate) return false; // ไม่มีวันหมดอายุ = ไม่หมดอายุ

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expDate = new Date(lot.expireDate);
      expDate.setHours(0, 0, 0, 0);

      return expDate <= today; // ต้องน้อยกว่าวันนี้ถึงจะนับว่าหมดอายุ
    }

    return true; // ถ้าเป็น SALE หรือ DAMAGED โชว์หมด
  })

  const handleSubmit = async () => {
    const deductAmount = Number(form.amount)
    if (!form.amount || deductAmount <= 0) {
      toast.error("กรุณาระบุจำนวนที่ต้องการเบิกให้ถูกต้อง")
      return
    }
    if (deductAmount > totalStock) {
      toast.error("จำนวนที่เบิกมากกว่าสต๊อกทั้งหมด")
      return
    }

    let targetLotId = form.lotId

    if (!targetLotId) {
      const availableLot = availableLots.find(l => l.stock >= deductAmount)
      if (!availableLot) {
        toast.error("ไม่มีล๊อตใดที่มีสต๊อกเข้าเงื่อนไขเพียงพอให้เบิกจำนวนนี้รวดเดียว กรุณาระบุล๊อตเอง")
        return
      }
      targetLotId = String(availableLot.id)
    } else {
      const selectedLot = availableLots.find(l => String(l.id) === targetLotId)
      if (!selectedLot) {
        toast.error("ล๊อตที่คุณเลือกไม่ตรงกับเงื่อนไข หรือไม่มีสต๊อก")
        return
      }
      if (selectedLot.stock < deductAmount) {
        toast.error(`ล๊อตนี้มีสต๊อกไม่พอ (เหลือแค่ ${selectedLot.stock})`)
        return
      }
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/inventory/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lotId: Number(targetLotId),
          amount: deductAmount,
          reason: form.reason,
          note: form.note
        })
      })

      if (res.ok) {
        onSuccess()
        onClose()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "เกิดข้อผิดพลาดในการทำรายการ")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("ไม่สามารถบันทึกข้อมูลได้")
    } finally {
      setIsLoading(false)
    }
  }

  const totalStock = lots.reduce((sum, lot) => sum + Number(lot.stock), 0)

  // ดึงข้อมูลสำหรับปุ่ม Dropdown เหตุผล
  const getReasonDisplay = () => {
    if (form.reason === "SALE") return { text: "เบิกไปขาย / ใช้งานปกติ" }
    if (form.reason === "DAMAGED") return { text: "ตัดของชำรุด / เสียหาย" }
    return { text: "ตัดสินค้าหมดอายุ" }
  }
  const currentReason = getReasonDisplay()

  // ฟังก์ชันเปลี่ยนเหตุผล (ถ้าเปลี่ยนเหตุผล ให้เคลียร์ lotId ที่เลือกไว้ด้วย เผื่อมันไม่ตรงเงื่อนไข)
  const handleSelectReason = (reason: string) => {
    setForm({ ...form, reason, lotId: "" })
    setIsReasonDropdownOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">

        <div className="rounded-t-2xl px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50/50">
          <div className="flex items-center gap-2 text-red-700">
            <ArrowUpFromLine className="w-5 h-5" />
            <h2 className="text-lg font-bold">เบิกออก / ตัดสต๊อกสินค้า</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-xl flex justify-between items-center">
            <span className="font-bold text-gray-900 truncate pr-2">{productName}</span>
            <span className="text-sm font-medium px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 whitespace-nowrap shadow-sm">
              คงเหลือรวม: {totalStock}
            </span>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">จำนวนที่ต้องการเบิกออก *</label>
            <input
              type="number"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="ใส่จำนวน..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:bg-white bg-gray-50 transition-all font-medium focus:ring-red-500"
            />
          </div>

          {/* 🌟 วัตถุประสงค์ (Custom Dropdown) 3 ตัวเลือก */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">วัตถุประสงค์การเบิก *</label>
            <button
              type="button"
              onClick={() => {
                setIsReasonDropdownOpen(!isReasonDropdownOpen)
                setIsLotDropdownOpen(false)
              }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:border-red-500 bg-gray-50 focus:bg-white transition-all font-medium cursor-pointer shadow-sm flex justify-between items-center"
            >
              <div className="flex items-center gap-2">
                <span className={`text-gray-800 ${form.reason === 'EXPIRED' ? 'text-red-600 font-bold' : ''}`}>
                  {currentReason.text}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isReasonDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isReasonDropdownOpen && (
              <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                <button
                  type="button"
                  onClick={() => handleSelectReason("SALE")}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${form.reason === "SALE" ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`${form.reason === "SALE" ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      เบิกไปขาย / ใช้งานปกติ
                    </span>
                  </div>
                  {form.reason === "SALE" && <Check className="w-4 h-4 text-green-600" />}
                </button>
                <div className="h-px bg-gray-50" />
                <button
                  type="button"
                  onClick={() => handleSelectReason("DAMAGED")}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${form.reason === "DAMAGED" ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`${form.reason === "DAMAGED" ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                      ตัดของชำรุด / เสียหาย
                    </span>
                  </div>
                  {form.reason === "DAMAGED" && <Check className="w-4 h-4 text-orange-500" />}
                </button>
                <div className="h-px bg-gray-50" />
                <button
                  type="button"
                  onClick={() => handleSelectReason("EXPIRED")}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-red-50 transition-colors flex items-center justify-between ${form.reason === "EXPIRED" ? 'bg-red-50/50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`${form.reason === "EXPIRED" ? 'font-bold text-red-600' : 'font-medium text-gray-700'}`}>
                      ตัดสินค้าหมดอายุ
                    </span>
                  </div>
                  {form.reason === "EXPIRED" && <Check className="w-4 h-4 text-red-600" />}
                </button>
              </div>
            )}
          </div>

          {/* 🌟 เลือกล็อต (กรองแล้ว) */}
          <div className="bg-red-50/30 p-4 rounded-2xl border border-red-100">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[11px] font-bold text-red-700">เลือกล็อตที่ต้องการเบิก</label>
              {form.reason === "EXPIRED" && (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">กรองเฉพาะของหมดอายุ</span>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsLotDropdownOpen(!isLotDropdownOpen)
                  setIsReasonDropdownOpen(false)
                }}
                disabled={availableLots.length === 0}
                className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 flex justify-between items-center hover:border-red-400 transition-all cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${availableLots.length === 0 ? 'bg-gray-100' : 'bg-red-50'}`}>
                    <Package className={`w-4 h-4 ${availableLots.length === 0 ? 'text-gray-400' : 'text-red-600'}`} />
                  </div>
                  <div className="text-left">
                    {availableLots.length === 0 ? (
                      <p className="text-xs font-bold text-gray-500">ไม่มีข้อมูลล๊อตที่เบิกได้</p>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-gray-900">
                          {form.lotId
                            ? availableLots.find(l => String(l.id) === String(form.lotId))?.lotNumber
                            : "ตัดอัตโนมัติ (จากลิสต์ด้านล่าง)"}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {form.lotId ? "ล็อตที่ระบุ" : "ระบบจะหยิบของจากลิสต์ให้"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLotDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLotDropdownOpen && availableLots.length > 0 && (
                <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-2 animate-in slide-in-from-top-2">
                  <button
                    onClick={() => {
                      setForm({ ...form, lotId: "" })
                      setIsLotDropdownOpen(false)
                    }}
                    className={`w-full p-3 rounded-xl text-left hover:bg-red-50 transition-colors mb-1 cursor-pointer flex justify-between items-center ${!form.lotId ? 'bg-red-50 border border-red-100' : ''}`}
                  >
                    <div>
                      <p className="text-xs font-black text-red-600">ตัดอัตโนมัติ (จากลิสต์ด้านล่าง)</p>
                    </div>
                    {!form.lotId && <Check className="w-4 h-4 text-red-600" />}
                  </button>

                  <div className="h-px bg-gray-50 my-1" />

                  {availableLots.map(lot => {
                    const isExpiredLot = lot.expireDate && new Date(lot.expireDate) < new Date();

                    return (
                      <button
                        key={lot.id}
                        onClick={() => {
                          setForm({ ...form, lotId: String(lot.id) })
                          setIsLotDropdownOpen(false)
                        }}
                        className={`w-full p-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer ${String(form.lotId) === String(lot.id) ? 'bg-red-50 border border-red-100' : ''}`}
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            {lot.lotNumber}
                            {isExpiredLot && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          </p>
                          <p className={`text-[10px] ${isExpiredLot ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                            {lot.expireDate ? `หมดอายุ: ${new Date(lot.expireDate).toLocaleDateString('th-TH')}` : 'ไม่มีวันหมดอายุ'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-black text-gray-700">{Number(lot.stock)}</p>
                          {String(form.lotId) === String(lot.id) ? <Check className="w-4 h-4 text-red-600" /> : <div className="w-4" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:bg-white bg-gray-50 transition-all font-medium focus:ring-red-500"
              placeholder="เช่น ขายหน้าร้าน, สินค้าแตกหัก..."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || availableLots.length === 0}
              className="flex-1 py-2.5 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer bg-red-600 hover:bg-red-700"
            >
              {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "ยืนยันการทำรายการ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}