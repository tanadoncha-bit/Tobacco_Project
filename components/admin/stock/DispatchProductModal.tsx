"use client"

import { useState, useEffect, useMemo } from "react"
import { X, ArrowUpFromLine, Package, ChevronDown, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

type ProductLot = {
  id: number
  lotNumber: string
  stock: number
  expireDate?: string | null
  variantId: number
  variant: {
    values: { optionValue: { value: string } }[]
  }
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
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false)
  const [form, setForm] = useState({ amount: "", lotId: "", reason: "OFFLINE_SALE", note: "" })

  useEffect(() => {
    if (open && productId) {
      fetch(`/api/products/${productId}/lots`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setLots(Array.isArray(data) ? data : []))
        .catch(() => setLots([]))

      setForm({ amount: "", lotId: "", reason: "OFFLINE_SALE", note: "" })
      setIsLotDropdownOpen(false)
      setIsReasonDropdownOpen(false)
      setSelectedVariantId(null)
      setIsVariantDropdownOpen(false)
    }
  }, [open, productId])

  const availableVariants = useMemo(() => {
    const seen = new Set<number>()
    return lots
      .filter(lot => {
        if (seen.has(lot.variantId)) return false
        seen.add(lot.variantId)
        return true
      })
      .map(lot => ({
        id: lot.variantId,
        label: lot.variant?.values?.map(v => v.optionValue.value).join(" / ") || "ค่าเริ่มต้น",
        totalStock: lots.filter(l => l.variantId === lot.variantId).reduce((s, l) => s + Number(l.stock), 0)
      }))
  }, [lots])

  const availableLots = useMemo(() => lots.filter(lot => {
    if (!selectedVariantId || lot.variantId !== selectedVariantId) return false
    if (Number(lot.stock) <= 0) return false
    if (lot.expireDate) {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const expDate = new Date(lot.expireDate); expDate.setHours(0, 0, 0, 0)
      if (expDate <= today) return false
    }
    return true
  }), [lots, selectedVariantId])

  const totalStock = lots.reduce((sum, lot) => sum + Number(lot.stock), 0)
  const selectedVariantStock = selectedVariantId
    ? availableVariants.find(v => v.id === selectedVariantId)?.totalStock ?? 0
    : 0

  const handleSelectReason = (reason: string) => {
    setForm({ ...form, reason, lotId: "" })
    setIsReasonDropdownOpen(false)
  }

  const handleSubmit = async () => {
    const deductAmount = Number(form.amount)
    if (!form.amount || deductAmount <= 0) return toast.error("กรุณาระบุจำนวนที่ต้องการเบิกให้ถูกต้อง")
    if (!selectedVariantId) return toast.error("กรุณาเลือกตัวเลือกสินค้าที่จะเบิก")
    if (deductAmount > selectedVariantStock) return toast.error("จำนวนที่เบิกมากกว่าสต็อกของตัวเลือกนี้")

    let targetLotId = form.lotId
    if (!targetLotId) {
      const availableLot = availableLots.find(l => l.stock >= deductAmount)
      if (!availableLot) return toast.error("ไม่มีล็อตใดที่มีสต็อกเพียงพอ กรุณาระบุล็อตเอง")
      targetLotId = String(availableLot.id)
    } else {
      const selectedLot = availableLots.find(l => String(l.id) === targetLotId)
      if (!selectedLot) return toast.error("ล็อตที่เลือกไม่มีสต็อก")
      if (selectedLot.stock < deductAmount) return toast.error(`ล็อตนี้มีสต็อกไม่พอ (เหลือ ${selectedLot.stock})`)
    }

    setIsLoading(true)
    try {
      const res = await fetch(`/api/inventory/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lotId: Number(targetLotId), amount: deductAmount, reason: form.reason, note: form.note })
      })
      if (res.ok) {
        toast.success("บันทึกการเบิกสินค้าเรียบร้อย")
        onSuccess()
        onClose()
      } else {
        const err = await res.json()
        toast.error(err.error || "เกิดข้อผิดพลาด")
      }
    } catch {
      toast.error("ไม่สามารถบันทึกข้อมูลได้")
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="rounded-t-2xl px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-rose-50/50 sticky top-0">
          <div className="flex items-center gap-2 text-rose-700">
            <ArrowUpFromLine className="w-5 h-5" />
            <h2 className="text-lg font-bold">เบิกออก / ตัดสต็อกสินค้า</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Product info */}
          <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-xl flex justify-between items-center">
            <span className="font-bold text-gray-900 truncate pr-2">{productName}</span>
            <span className="text-sm font-medium px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600 whitespace-nowrap shadow-sm">
              คงเหลือรวม: {totalStock}
            </span>
          </div>

          {/* จำนวน */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">จำนวนที่ต้องการเบิกออก *</label>
            <input
              type="number" min="1"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              placeholder="ใส่จำนวน..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white bg-gray-50 transition-all font-medium"
            />
          </div>

          {/* วัตถุประสงค์ */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">วัตถุประสงค์การเบิก *</label>
            <button
              type="button"
              onClick={() => { setIsReasonDropdownOpen(!isReasonDropdownOpen); setIsLotDropdownOpen(false); setIsVariantDropdownOpen(false) }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 flex justify-between items-center cursor-pointer font-medium hover:border-rose-300 transition-all"
            >
              <span className="text-gray-800">
                {form.reason === "OFFLINE_SALE" ? "เบิกไปขายหน้าร้าน" : "ตัดของชำรุด / เสียหาย"}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isReasonDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isReasonDropdownOpen && (
              <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                {[
                  { value: "OFFLINE_SALE", label: "เบิกไปขายหน้าร้าน", check: "text-emerald-600" },
                  { value: "DAMAGED",      label: "ตัดของชำรุด / เสียหาย", check: "text-orange-500" },
                ].map((opt, i) => (
                  <div key={opt.value}>
                    {i > 0 && <div className="h-px bg-gray-50" />}
                    <button
                      type="button"
                      onClick={() => handleSelectReason(opt.value)}
                      className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors ${form.reason === opt.value ? "bg-gray-50 font-bold text-gray-900" : "font-medium text-gray-700"}`}
                    >
                      {opt.label}
                      {form.reason === opt.value && <Check className={`w-4 h-4 ${opt.check}`} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* เลือก Variant */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-2">ตัวเลือกสินค้าที่จะเบิก *</label>
            <button
              type="button"
              onClick={() => { setIsVariantDropdownOpen(!isVariantDropdownOpen); setIsLotDropdownOpen(false); setIsReasonDropdownOpen(false) }}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 flex justify-between items-center cursor-pointer font-medium hover:border-rose-300 transition-all"
            >
              <span className={selectedVariantId ? "text-gray-900 font-bold" : "text-gray-400"}>
                {selectedVariantId
                  ? availableVariants.find(v => v.id === selectedVariantId)?.label
                  : "-- เลือกตัวเลือกสินค้า --"}
              </span>
              <div className="flex items-center gap-2">
                {selectedVariantId && (
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    เหลือ {selectedVariantStock}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isVariantDropdownOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isVariantDropdownOpen && (
              <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                {availableVariants.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-gray-400 text-center font-medium">ไม่มีตัวเลือกที่มีสต็อก</div>
                ) : (
                  availableVariants.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setSelectedVariantId(v.id); setForm(f => ({ ...f, lotId: "" })); setIsVariantDropdownOpen(false) }}
                      className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center hover:bg-gray-50 cursor-pointer transition-colors ${selectedVariantId === v.id ? "bg-rose-50 font-bold text-gray-900" : "font-medium text-gray-700"}`}
                    >
                      <span>{v.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.totalStock > 0 ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>
                          {v.totalStock} ชิ้น
                        </span>
                        {selectedVariantId === v.id && <Check className="w-4 h-4 text-rose-600" />}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Lot section — โชว์เฉพาะตอนเลือก variant แล้ว */}
          {selectedVariantId && availableLots.length === 0 && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-center">
              <p className="text-sm font-bold text-rose-600">ตัวเลือกนี้ไม่มีสต็อกในคลัง</p>
            </div>
          )}

          {selectedVariantId && availableLots.length > 0 && (
            <div className="bg-rose-50/30 p-4 rounded-2xl border border-rose-100">
              <label className="block text-[11px] font-bold text-rose-700 mb-2">เลือกล็อตที่ต้องการเบิก</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => { setIsLotDropdownOpen(!isLotDropdownOpen); setIsReasonDropdownOpen(false); setIsVariantDropdownOpen(false) }}
                  className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 flex justify-between items-center hover:border-rose-400 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50">
                      <Package className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-900">
                        {form.lotId
                          ? availableLots.find(l => String(l.id) === String(form.lotId))?.lotNumber
                          : "ตัดอัตโนมัติ (FIFO)"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {form.lotId ? "ล็อตที่ระบุ" : "ระบบจะหยิบจากล็อตเก่าสุดให้"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isLotDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isLotDropdownOpen && (
                  <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-2 animate-in slide-in-from-top-2">
                    <button
                      onClick={() => { setForm({ ...form, lotId: "" }); setIsLotDropdownOpen(false) }}
                      className={`w-full p-3 rounded-xl text-left hover:bg-rose-50 transition-colors mb-1 cursor-pointer flex justify-between items-center ${!form.lotId ? "bg-rose-50 border border-rose-100" : ""}`}
                    >
                      <p className="text-xs font-black text-rose-600">ตัดอัตโนมัติ (FIFO)</p>
                      {!form.lotId && <Check className="w-4 h-4 text-rose-600" />}
                    </button>
                    <div className="h-px bg-gray-50 my-1" />
                    {availableLots.map(lot => (
                      <button
                        key={lot.id}
                        onClick={() => { setForm({ ...form, lotId: String(lot.id) }); setIsLotDropdownOpen(false) }}
                        className={`w-full p-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer ${String(form.lotId) === String(lot.id) ? "bg-rose-50 border border-rose-100" : ""}`}
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900">{lot.lotNumber}</p>
                          <p className="text-[10px] text-gray-400">
                            {lot.expireDate ? `หมดอายุ: ${new Date(lot.expireDate).toLocaleDateString("th-TH")}` : "ไม่มีวันหมดอายุ"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-700">{lot.stock} ชิ้น</span>
                          {String(form.lotId) === String(lot.id) ? <Check className="w-4 h-4 text-rose-600" /> : <div className="w-4" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* หมายเหตุ */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder={form.reason === "OFFLINE_SALE" ? "เช่น ขายงานวันเสาร์, ลูกค้าประจำ..." : "เช่น สินค้าแตกหัก, เปียกน้ำ..."}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white bg-gray-50 transition-all font-medium"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
              ยกเลิก
            </button>
            <button type="button" onClick={handleSubmit}
              disabled={isLoading || !selectedVariantId || availableLots.length === 0}
              className="flex-1 py-2.5 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer bg-rose-600 hover:bg-rose-700">
              {isLoading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />กำลังบันทึก...</>
                : "ยืนยันการทำรายการ"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}