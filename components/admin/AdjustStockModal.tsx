"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, X, ArrowDownToLine } from "lucide-react"
import { toast } from "sonner"

export default function AdjustStockModal({ open, productId, onClose, onSuccess }: { open: boolean, productId: number | null, onClose: () => void, onSuccess: () => void }) {
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const [isVariantOpen, setIsVariantOpen] = useState(false)
  const variantRef = useRef<HTMLDivElement>(null)


  const [reason, setReason] = useState("PRODUCTION")
  const [isReasonOpen, setIsReasonOpen] = useState(false)
  const reasonRef = useRef<HTMLDivElement>(null)

  const REASON_OPTIONS = [
    { value: "PRODUCTION", label: "รับเข้าจากการผลิต (Manual)" },
    { value: "RETURN", label: "ลูกค้านำสินค้ามาคืน" },
    { value: "AUDIT", label: "ปรับยอดสต๊อก (นับแล้วเจอของเกิน)" },
  ]

  useEffect(() => {
    if (open && productId) {
      setIsFetching(true)
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          if (data.variants) setVariants(data.variants)
          if (data.variants?.length === 1) setSelectedVariantId(data.variants[0].id.toString())
        })
        .finally(() => setIsFetching(false))
    } else {
      setVariants([]);
      setSelectedVariantId("");
      setAmount("");
      setReason("PRODUCTION");
      setReference("");
      setIsVariantOpen(false);
      setIsReasonOpen(false);
    }
  }, [open, productId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variantRef.current && !variantRef.current.contains(event.target as Node)) {
        setIsVariantOpen(false)
      }
      if (reasonRef.current && !reasonRef.current.contains(event.target as Node)) {
        setIsReasonOpen(false)
      }
    }

    if (isVariantOpen || isReasonOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isVariantOpen, isReasonOpen])

  const handleSave = async () => {
    if (!selectedVariantId) return toast.error("กรุณาเลือกตัวเลือกสินค้า")
    if (!amount || Number(amount) <= 0) return toast.error("กรุณาระบุจำนวนให้ถูกต้อง")

    if (!reference.trim()) {
      return toast.error("กรุณาระบุเลขที่เอกสารอ้างอิงเพื่อความโปร่งใส")
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/products/adjust-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: Number(selectedVariantId),
          amount: Number(amount),
          type: "IN",
          reason: reason,
          reference: reference,
        })
      })

      if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการปรับสต๊อก")

      toast.success("เพิ่มสต๊อกเรียบร้อยแล้ว")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedVariant = variants.find(v => v.id.toString() === selectedVariantId)
  const selectedLabel = selectedVariant
    ? `${selectedVariant.values?.map((val: any) => val.optionValue.value).join(" / ") || "ค่าเริ่มต้น"} (คงเหลือ: ${selectedVariant.stock})`
    : "-- กรุณาเลือกตัวเลือกสินค้า --"

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
          <div className="flex items-center gap-2 text-emerald-700">
            <ArrowDownToLine className="w-5 h-5" />
            <h2 className="text-lg font-bold">เพิ่มจำนวนสินค้า (รับเข้า)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isFetching ? (
            <div className="text-center py-8 text-gray-400 font-medium">กำลังโหลดข้อมูลสินค้า...</div>
          ) : (
            <>
              <div className="space-y-2" ref={variantRef}>
                <label className="block text-sm font-bold text-gray-700">เลือกตัวเลือก (Variant)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsVariantOpen(!isVariantOpen)}
                    className={`w-full flex items-center justify-between border ${isVariantOpen ? 'ring-2 ring-emerald-500' : 'border-gray-200 hover:border-emerald-300'
                      } rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-all cursor-pointer text-left`}
                  >
                    <span className={selectedVariantId ? "text-gray-800 font-bold" : "text-gray-400 font-medium"}>
                      {selectedLabel}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isVariantOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                  </button>

                  {isVariantOpen && (
                    <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1.5">
                        {variants.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">ไม่มีตัวเลือกสินค้า</div>
                        ) : (
                          variants.map((v: any) => {
                            const optionName = v.values?.map((val: any) => val.optionValue.value).join(" / ") || "ค่าเริ่มต้น (ไม่มีตัวเลือก)"
                            const isSelected = selectedVariantId === v.id.toString()

                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  setSelectedVariantId(v.id.toString())
                                  setIsVariantOpen(false)
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${isSelected
                                  ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500"
                                  : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                                  }`}
                              >
                                <span>{optionName}</span>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isSelected ? 'bg-gremeraldeen-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                  เหลือ {v.stock}
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">จำนวนที่ต้องการเพิ่ม (ชิ้น)</label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="เช่น 10, 50"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-gray-50 transition-all font-medium"
                />
              </div>

              <div className="space-y-2" ref={reasonRef}>
                <label className="block text-sm font-bold text-gray-700">
                  สาเหตุการรับเข้า <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsReasonOpen(!isReasonOpen)}
                    className={`w-full flex items-center justify-between border ${isReasonOpen ? 'ring-2 ring-emerald-500' : 'border-gray-200 hover:border-emerald-300'
                      } rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-all cursor-pointer text-left`}
                  >
                    <span className="text-gray-800 font-bold">
                      {REASON_OPTIONS.find((opt) => opt.value === reason)?.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isReasonOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                  </button>

                  {isReasonOpen && (
                    <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1.5">
                        {REASON_OPTIONS.map((opt) => {
                          const isSelected = reason === opt.value

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                setReason(opt.value)
                                setIsReasonOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${isSelected
                                ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500"
                                : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                                }`}
                            >
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">เลขที่เอกสารอ้างอิง / ทิกเก็ต <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={
                    reason === "PRODUCTION" ? "เช่น WO-20231001" :
                      reason === "RETURN" ? "เช่น บิลเลขที่ INV-00123" :
                        "เช่น เลขที่บันทึกข้อความ"
                  }
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-gray-50 transition-all font-medium"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  ต้องระบุเลขอ้างอิงเสมอ เพื่อให้สามารถตรวจสอบย้อนหลังได้
                </p>
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
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? "กำลังบันทึก..." : "ยืนยันรับเข้าสต๊อก"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}