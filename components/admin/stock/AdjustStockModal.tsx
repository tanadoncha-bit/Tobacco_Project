"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, X, ArrowDownToLine, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

function CustomDatePicker({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(value ? new Date(value) : new Date())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (value) setCurrentDate(new Date(value)) }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const days = Array(firstDayOfMonth).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  const monthNames = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]

  const handleSelectDate = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const yyyy = selected.getFullYear()
    const mm = String(selected.getMonth() + 1).padStart(2, "0")
    const dd = String(selected.getDate()).padStart(2, "0")
    onChange(`${yyyy}-${mm}-${dd}`)
    setIsOpen(false)
  }

  const displayValue = value
    ? new Date(value).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
    : "เลือกวันหมดอายุ..."

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white flex justify-between items-center cursor-pointer font-medium text-gray-700 hover:border-emerald-300 transition-all"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>{displayValue}</span>
        <CalendarIcon className="w-4 h-4 text-emerald-600" />
      </div>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-[280px] bg-white rounded-2xl shadow-lg border border-gray-100 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer text-gray-500 hover:text-emerald-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="font-bold text-gray-800 text-sm">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
              </div>
              <button type="button" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer text-gray-500 hover:text-emerald-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="p-2" />
                const isSelected = value &&
                  new Date(value).getDate() === day &&
                  new Date(value).getMonth() === currentDate.getMonth() &&
                  new Date(value).getFullYear() === currentDate.getFullYear()
                return (
                  <button key={day} type="button" onClick={() => handleSelectDate(day)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all mx-auto cursor-pointer ${isSelected ? "bg-emerald-500 text-white font-bold" : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"}`}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type ReturnLot = {
  id: number
  lotNumber: string
  expireDate?: string | null
  variantId: number
  variantLabel: string
}

export default function AdjustStockModal({ open, productId, onClose, onSuccess }: {
  open: boolean
  productId: number | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [variants, setVariants] = useState<any[]>([])
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const [isVariantOpen, setIsVariantOpen] = useState(false)
  const variantRef = useRef<HTMLDivElement>(null)

  const [reason, setReason] = useState("NEW_PURCHASE")
  const [isReasonOpen, setIsReasonOpen] = useState(false)
  const reasonRef = useRef<HTMLDivElement>(null)

  const [lotNumber, setLotNumber] = useState("")
  const [expireDate, setExpireDate] = useState("")
  const [noExpire, setNoExpire] = useState(false)
  const [totalCost, setTotalCost] = useState("")

  // Return lot
  const [returnLots, setReturnLots] = useState<ReturnLot[]>([])
  const [selectedReturnLotId, setSelectedReturnLotId] = useState("")
  const [isReturnLotOpen, setIsReturnLotOpen] = useState(false)
  const returnLotRef = useRef<HTMLDivElement>(null)

  // Audit lot
  const [auditLots, setAuditLots] = useState<ReturnLot[]>([])
  const [selectedAuditLotId, setSelectedAuditLotId] = useState("")
  const [isAuditLotOpen, setIsAuditLotOpen] = useState(false)
  const auditLotRef = useRef<HTMLDivElement>(null)

  // Production order
  const [pendingProductions, setPendingProductions] = useState<any[]>([])
  const [selectedDocNo, setSelectedDocNo] = useState("")
  const [isDocOpen, setIsDocOpen] = useState(false)
  const [isFetchingDocs, setIsFetchingDocs] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

  const REASON_OPTIONS = [
    { value: "NEW_PURCHASE", label: "รับเข้าสินค้าใหม่ (ซื้อมาขายไป)" },
    { value: "PRODUCTION", label: "รับเข้าจากการผลิต (Manual)" },
    { value: "PRODUCTION_ORDER", label: "รับเข้าจากใบสั่งผลิต" },
    { value: "RETURN", label: "คืนสินค้า (เบิกขาย)" },
    { value: "AUDIT", label: "ปรับยอดสต๊อก (นับแล้วเจอของเกิน)" },
  ]

  const showLotSection = reason === "NEW_PURCHASE" || reason === "PRODUCTION" || reason === "PRODUCTION_ORDER"

  useEffect(() => {
    if (!showLotSection) {
      setLotNumber("")
      setExpireDate("")
      setNoExpire(false)
      setTotalCost("")
    }
  }, [showLotSection])

  // fetch variants เมื่อ modal เปิด
  useEffect(() => {
    if (open && productId) {
      setIsFetching(true)
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          if (data.variants) {
            const variantsWithStock = data.variants.map((v: any) => ({
              ...v,
              stock: (v.productVariantLots ?? [])
                .filter((lot: any) => !lot.expireDate || new Date(lot.expireDate) > new Date())
                .reduce((sum: number, lot: any) => sum + lot.stock, 0)
            }))
            setVariants(variantsWithStock)
            if (variantsWithStock.length === 1) setSelectedVariantId(variantsWithStock[0].id.toString())
          }
        })
        .finally(() => setIsFetching(false))

      setVariants([])
      setSelectedVariantId("")
      setAmount("")
      setReason("NEW_PURCHASE")
      setIsVariantOpen(false)
      setIsReasonOpen(false)
      setLotNumber("")
      setExpireDate("")
      setNoExpire(false)
      setTotalCost("")
      setReturnLots([])
      setSelectedReturnLotId("")
      setIsReturnLotOpen(false)
      setAuditLots([])
      setSelectedAuditLotId("")
      setIsAuditLotOpen(false)
      setPendingProductions([])
      setSelectedDocNo("")
      setIsDocOpen(false)
    }
  }, [open, productId])

  // fetch return lots เมื่อเลือก RETURN
  useEffect(() => {
    if (reason === "RETURN" && productId) {
      fetch(`/api/products/${productId}/return-lots`)
        .then(res => res.ok ? res.json() : [])
        .then(setReturnLots)
        .catch(() => setReturnLots([]))
      setSelectedReturnLotId("")
    } else {
      setReturnLots([])
      setSelectedReturnLotId("")
    }
  }, [reason, productId])

  // fetch audit lots เมื่อเลือก AUDIT
  useEffect(() => {
    if (reason === "AUDIT" && productId) {
      fetch(`/api/products/${productId}/lots`)
        .then(res => res.ok ? res.json() : [])
        .then((data: any[]) => {
          const now = new Date()
          setAuditLots(
            data
              .filter(lot => !lot.expireDate || new Date(lot.expireDate) > now)
              .map(lot => ({
                id: lot.id,
                lotNumber: lot.lotNumber || `LOT-${lot.id}`,
                expireDate: lot.expireDate,
                variantId: lot.variantId,
                variantLabel: lot.variant?.values?.map((v: any) => v.optionValue.value).join(" / ") || "ค่าเริ่มต้น"
              }))
          )
        })
        .catch(() => setAuditLots([]))
      setSelectedAuditLotId("")
    } else {
      setAuditLots([])
      setSelectedAuditLotId("")
    }
  }, [reason, productId])

  // fetch pending production orders เมื่อเลือก PRODUCTION_ORDER
  useEffect(() => {
    if (reason === "PRODUCTION_ORDER" && productId) {
      setIsFetchingDocs(true)
      fetch("/api/productions/pending")
        .then(res => res.json())
        .then(data => Array.isArray(data) ? setPendingProductions(data) : setPendingProductions([]))
        .catch(() => setPendingProductions([]))
        .finally(() => setIsFetchingDocs(false))
      setSelectedDocNo("")
    } else {
      setPendingProductions([])
      setSelectedDocNo("")
    }
  }, [reason, productId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (variantRef.current && !variantRef.current.contains(event.target as Node)) setIsVariantOpen(false)
      if (reasonRef.current && !reasonRef.current.contains(event.target as Node)) setIsReasonOpen(false)
      if (returnLotRef.current && !returnLotRef.current.contains(event.target as Node)) setIsReturnLotOpen(false)
      if (auditLotRef.current && !auditLotRef.current.contains(event.target as Node)) setIsAuditLotOpen(false)
      if (docRef.current && !docRef.current.contains(event.target as Node)) setIsDocOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSave = async () => {
    if (reason !== "PRODUCTION_ORDER" && !selectedVariantId) return toast.error("กรุณาเลือกตัวเลือกสินค้า")
    if (!amount || Number(amount) <= 0) return toast.error("กรุณาระบุจำนวนให้ถูกต้อง")
    if (showLotSection && !noExpire && !expireDate) return toast.error("กรุณาระบุวันหมดอายุ หรือเลือก 'ไม่มีวันหมดอายุ'")
    if (reason === "NEW_PURCHASE" && (!totalCost || Number(totalCost) <= 0)) return toast.error("กรุณาระบุราคารวมทั้งล็อต")
    if (reason === "RETURN" && !selectedReturnLotId) return toast.error("กรุณาเลือก Lot ที่ต้องการคืน")
    if (reason === "AUDIT" && !selectedAuditLotId) return toast.error("กรุณาเลือก Lot ที่ต้องการปรับยอด")
    if (reason === "PRODUCTION_ORDER" && !selectedDocNo) return toast.error("กรุณาเลือกใบสั่งผลิต")

    setIsLoading(true)
    try {
      // PRODUCTION_ORDER ใช้ API ของ ReceiveProduceModal
      if (reason === "PRODUCTION_ORDER") {
        const res = await fetch("/api/productions/receive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docNo: selectedDocNo,
            receivedAmount: Number(amount),
            expireDate: noExpire ? null : (expireDate || null),
            note: "",
          })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || data.message || "เกิดข้อผิดพลาด")
        toast.success(`รับเข้าสินค้าบิล ${selectedDocNo} เรียบร้อยแล้ว`)
      } else {
        const res = await fetch("/api/products/adjust-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: Number(selectedVariantId),
            amount: Number(amount),
            type: "IN",
            reason,
            lotNumber: showLotSection ? (lotNumber || undefined) : undefined,
            expireDate: showLotSection ? (noExpire ? null : (expireDate || null)) : null,
            unitCost: reason === "NEW_PURCHASE" && totalCost && Number(amount) > 0
              ? Number(totalCost) / Number(amount)
              : undefined,
            variantLotId: reason === "RETURN" && selectedReturnLotId
              ? Number(selectedReturnLotId)
              : reason === "AUDIT" && selectedAuditLotId
                ? Number(selectedAuditLotId)
                : undefined,
          })
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(errorData.error || errorData.message || "เกิดข้อผิดพลาดในการปรับสต๊อก")
        }
        toast.success("เพิ่มสต๊อกเรียบร้อยแล้ว")
      }

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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="rounded-2xl px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50 shrink-0">
          <div className="flex items-center gap-2 text-emerald-700">
            <ArrowDownToLine className="w-5 h-5" />
            <h2 className="text-lg font-bold">เพิ่มจำนวนสินค้า (รับเข้า)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 pb-4 space-y-5 flex-1 overflow-y-auto">
          {isFetching ? (
            <div className="text-center py-8 text-gray-400 font-medium">กำลังโหลดข้อมูลสินค้า...</div>
          ) : (
            <>
              {/* Reason Selector */}
              <div className={`space-y-2 relative ${isReasonOpen ? "z-50" : "z-20"}`} ref={reasonRef}>
                <label className="block text-sm font-bold text-gray-700">สาเหตุการรับเข้า <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => setIsReasonOpen(!isReasonOpen)}
                  className={`w-full flex items-center justify-between border ${isReasonOpen ? "ring-2 ring-emerald-500" : "border-gray-200 hover:border-emerald-300"} rounded-xl px-4 py-2.5 text-sm bg-gray-50 transition-all cursor-pointer text-left`}
                >
                  <span className="text-gray-800 font-bold">{REASON_OPTIONS.find(opt => opt.value === reason)?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isReasonOpen ? "rotate-180 text-emerald-500" : ""}`} />
                </button>
                {isReasonOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1.5">
                      {REASON_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => { setReason(opt.value); setIsReasonOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${reason === opt.value ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Production Order Selector */}
              {reason === "PRODUCTION_ORDER" && (
                <div className={`space-y-2 relative ${isDocOpen ? "z-40" : "z-10"} animate-in fade-in slide-in-from-top-2 duration-300`} ref={docRef}>
                  <label className="block text-sm font-bold text-gray-700">เลือกใบสั่งผลิต <span className="text-red-500">*</span></label>
                  <button
                    type="button"
                    onClick={() => !isFetchingDocs && setIsDocOpen(!isDocOpen)}
                    disabled={isFetchingDocs}
                    className={`w-full flex items-center justify-between border ${isDocOpen ? "ring-2 ring-emerald-500" : "border-gray-200 hover:border-emerald-300"} rounded-xl px-4 py-2.5 text-sm bg-gray-50 transition-all cursor-pointer text-left disabled:opacity-50`}
                  >
                    <span className={selectedDocNo ? "text-gray-800 font-bold" : "text-gray-400 font-medium"}>
                      {isFetchingDocs
                        ? "กำลังโหลด..."
                        : selectedDocNo
                          ? `${selectedDocNo} - ${pendingProductions.find(p => p.docNo === selectedDocNo)?.productName}`
                          : "-- เลือกเลขที่เอกสาร --"}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDocOpen ? "rotate-180 text-emerald-500" : ""}`} />
                  </button>
                  {isDocOpen && !isFetchingDocs && (
                    <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1.5">
                        {pendingProductions.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">ไม่มีรายการค้างรับเข้า</div>
                        ) : pendingProductions.map(doc => (
                          <button
                            key={doc.docNo}
                            type="button"
                            onClick={() => {
                              setSelectedDocNo(doc.docNo)
                              setAmount(doc.amount.toString())
                              setIsDocOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${selectedDocNo === doc.docNo
                              ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500"
                              : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                            }`}
                          >
                            <span>{doc.docNo} - {doc.productName}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${selectedDocNo === doc.docNo ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                              {doc.amount} ชิ้น
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Variant Selector — ซ่อนเมื่อเป็น PRODUCTION_ORDER */}
              {reason !== "PRODUCTION_ORDER" && (
                <div className={`space-y-2 relative ${isVariantOpen ? "z-40" : "z-10"}`} ref={variantRef}>
                  <label className="block text-sm font-bold text-gray-700">เลือกตัวเลือก (Variant)</label>
                  <button
                    type="button"
                    onClick={() => setIsVariantOpen(!isVariantOpen)}
                    className={`w-full flex items-center justify-between border ${isVariantOpen ? "ring-2 ring-emerald-500" : "border-gray-200 hover:border-emerald-300"} rounded-xl px-4 py-2.5 text-sm bg-gray-50 transition-all cursor-pointer text-left`}
                  >
                    <span className={selectedVariantId ? "text-gray-800 font-bold" : "text-gray-400 font-medium"}>{selectedLabel}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isVariantOpen ? "rotate-180 text-emerald-500" : ""}`} />
                  </button>
                  {isVariantOpen && (
                    <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="py-1.5">
                        {variants.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500 text-center">ไม่มีตัวเลือกสินค้า</div>
                        ) : variants.map((v: any) => {
                          const optionName = v.values?.map((val: any) => val.optionValue.value).join(" / ") || "ค่าเริ่มต้น"
                          const isSelected = selectedVariantId === v.id.toString()
                          return (
                            <button key={v.id} type="button"
                              onClick={() => { setSelectedVariantId(v.id.toString()); setIsVariantOpen(false) }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${isSelected ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"}`}
                            >
                              <span>{optionName}</span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isSelected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                เหลือ {v.stock}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {reason === "PRODUCTION_ORDER" ? "จำนวนที่ผลิตได้จริง (ชิ้น)" : "จำนวนที่ต้องการเพิ่ม (ชิ้น)"}
                  {reason === "PRODUCTION_ORDER" && selectedDocNo && (
                    <span className="ml-2 text-emerald-600 font-normal">
                      (ยอดสั่ง: {pendingProductions.find(p => p.docNo === selectedDocNo)?.amount})
                    </span>
                  )}
                </label>
                <input
                  type="number" min="1" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="เช่น 10, 50"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-gray-50 transition-all font-medium"
                />
                {reason === "PRODUCTION_ORDER" && selectedDocNo && amount && (
                  (() => {
                    const ordered = pendingProductions.find(p => p.docNo === selectedDocNo)?.amount ?? 0
                    return Number(amount) < ordered ? (
                      <p className="text-[11px] text-red-500 mt-1 font-bold">
                        * น้อยกว่ายอดสั่งผลิต {ordered - Number(amount)} ชิ้น (วัตถุดิบที่เบิกไปแล้วจะไม่คืนสต๊อก)
                      </p>
                    ) : null
                  })()
                )}
              </div>

              {/* Lot section — NEW_PURCHASE / PRODUCTION / PRODUCTION_ORDER */}
              {showLotSection && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  {reason === "NEW_PURCHASE" && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        ราคารวมทั้งล็อต (฿) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">฿</span>
                        <input
                          type="number" min="0" step="0.01" value={totalCost}
                          onChange={e => setTotalCost(e.target.value)}
                          placeholder="เช่น 1000"
                          className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all font-medium placeholder:text-gray-400"
                        />
                      </div>
                      {totalCost && amount && Number(totalCost) > 0 && Number(amount) > 0 && (
                        <p className="text-xs text-emerald-600 font-bold mt-1.5">
                          ✓ ต้นทุน/ชิ้น = ฿{(Number(totalCost) / Number(amount)).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  )}

                  {reason !== "PRODUCTION_ORDER" && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        หมายเลข Lot <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                      </label>
                      <input
                        type="text"
                        placeholder={reason === "PRODUCTION" ? "เช่น LOT-PROD-001" : "เช่น LOT-BUY-001"}
                        value={lotNumber}
                        onChange={e => setLotNumber(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all font-medium placeholder:text-gray-400"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700">วันหมดอายุ</label>
                      <button type="button" onClick={() => {
                        const next = !noExpire
                        setNoExpire(next)
                        if (next) {
                          setExpireDate("")
                        } else {
                          const today = new Date()
                          setExpireDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`)
                        }
                      }} className="flex items-center gap-2 cursor-pointer">
                        <span className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${noExpire ? "bg-emerald-500" : "bg-gray-300"}`}>
                          <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${noExpire ? "translate-x-5" : "translate-x-0"}`} />
                        </span>
                        <span className="text-xs font-bold text-gray-500">ไม่มีวันหมดอายุ</span>
                      </button>
                    </div>
                    {!noExpire ? (
                      <CustomDatePicker value={expireDate} onChange={val => setExpireDate(val)} />
                    ) : (
                      <div className="w-full bg-white/60 border border-dashed border-emerald-200 rounded-xl px-4 py-3 text-center text-xs text-emerald-600/70 font-medium">
                        สินค้าล็อตนี้ไม่มีวันหมดอายุ
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Return Lot selector */}
              {reason === "RETURN" && (
                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-gray-700">
                    เลือก Lot ที่ต้องการคืนเข้า <span className="text-red-500">*</span>
                  </label>
                  {returnLots.length === 0 ? (
                    <div className="p-3 bg-white rounded-xl border border-gray-100 text-sm text-gray-400 text-center font-medium">
                      ไม่พบประวัติการเบิกออก
                    </div>
                  ) : (
                    <div className="relative" ref={returnLotRef}>
                      <button
                        type="button"
                        onClick={() => setIsReturnLotOpen(!isReturnLotOpen)}
                        className={`w-full flex items-center justify-between border ${isReturnLotOpen ? "ring-2 ring-emerald-400" : "border-gray-200 hover:border-emerald-400"} rounded-xl px-4 py-2.5 text-sm bg-white transition-all cursor-pointer`}
                      >
                        <span className={selectedReturnLotId ? "text-gray-800 font-bold" : "text-gray-400 font-medium"}>
                          {selectedReturnLotId
                            ? (() => {
                              const lot = returnLots.find(l => String(l.id) === selectedReturnLotId)
                              return lot ? `${lot.lotNumber} — ${lot.variantLabel}` : "-- เลือก Lot --"
                            })()
                            : "-- เลือก Lot ที่เคยเบิกออก --"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isReturnLotOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isReturnLotOpen && (
                        <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          {returnLots.map(lot => (
                            <button key={lot.id} type="button"
                              onClick={() => {
                                setSelectedReturnLotId(String(lot.id))
                                setSelectedVariantId(String(lot.variantId))
                                setIsReturnLotOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${selectedReturnLotId === String(lot.id)
                                ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500"
                                : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                              }`}
                            >
                              <div>
                                <p className="font-bold">{lot.lotNumber}</p>
                                <p className="text-xs text-gray-400">
                                  {lot.variantLabel}
                                  {lot.expireDate ? ` · หมดอายุ ${new Date(lot.expireDate).toLocaleDateString("th-TH")}` : ""}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Audit Lot selector */}
              {reason === "AUDIT" && (
                <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-gray-700">
                    เลือก Lot ที่ต้องการปรับยอด <span className="text-red-500">*</span>
                  </label>
                  {auditLots.length === 0 ? (
                    <div className="p-3 bg-white rounded-xl border border-gray-200 text-sm text-gray-400 text-center font-medium">
                      ไม่พบ Lot ในระบบ
                    </div>
                  ) : (
                    <div className="relative" ref={auditLotRef}>
                      <button
                        type="button"
                        onClick={() => setIsAuditLotOpen(!isAuditLotOpen)}
                        className={`w-full flex items-center justify-between border ${isAuditLotOpen ? "ring-2 ring-emerald-400" : "border-gray-200 hover:border-emerald-400"} rounded-xl px-4 py-2.5 text-sm bg-white transition-all cursor-pointer`}
                      >
                        <span className={selectedAuditLotId ? "text-gray-800 font-bold" : "text-gray-400 font-medium"}>
                          {selectedAuditLotId
                            ? (() => {
                              const lot = auditLots.find(l => String(l.id) === selectedAuditLotId)
                              return lot ? `${lot.lotNumber} — ${lot.variantLabel}` : "-- เลือก Lot --"
                            })()
                            : "-- เลือก Lot ที่ต้องการปรับยอด --"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isAuditLotOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isAuditLotOpen && (
                        <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                          {auditLots.map(lot => (
                            <button key={lot.id} type="button"
                              onClick={() => {
                                setSelectedAuditLotId(String(lot.id))
                                setSelectedVariantId(String(lot.variantId))
                                setIsAuditLotOpen(false)
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${selectedAuditLotId === String(lot.id)
                                ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500"
                                : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                              }`}
                            >
                              <div>
                                <p className="font-bold">{lot.lotNumber}</p>
                                <p className="text-xs text-gray-400">
                                  {lot.variantLabel}
                                  {lot.expireDate ? ` · หมดอายุ ${new Date(lot.expireDate).toLocaleDateString("th-TH")}` : ""}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="rounded-2xl px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
            ยกเลิก
          </button>
          <button type="button" onClick={handleSave} disabled={isLoading}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer">
            {isLoading ? "กำลังบันทึก..." : "ยืนยันรับเข้าสต๊อก"}
          </button>
        </div>
      </div>
    </div>
  )
}