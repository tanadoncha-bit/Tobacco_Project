"use client"

import { useState, useRef, useEffect } from "react"
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, PackagePlus, X } from "lucide-react"
import { toast } from "sonner"

function CustomDatePicker({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(
    value ? new Date(value) : new Date()
  )
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      setCurrentDate(new Date(value))
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () =>
      document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const days = Array(firstDayOfMonth)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
    "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
    "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ]

  const handleSelectDate = (day: number) => {
    const selected = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    )

    const yyyy = selected.getFullYear()
    const mm = String(selected.getMonth() + 1).padStart(2, "0")
    const dd = String(selected.getDate()).padStart(2, "0")

    onChange(`${yyyy}-${mm}-${dd}`)
    setIsOpen(false)
  }

  const displayValue = value
    ? new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
    : "เลือกวันหมดอายุ..."

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white flex justify-between items-center cursor-pointer font-medium text-gray-700 hover:border-emerald-300"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {displayValue}
        </span>
        <CalendarIcon className="w-4 h-4 text-emerald-600" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[280px] bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-[70]">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }
              className="p-1.5 hover:bg-emerald-50 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="font-bold text-gray-800 text-sm">
              {monthNames[currentDate.getMonth()]}{" "}
              {currentDate.getFullYear() + 543}
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1,
                    1
                  )
                )
              }
              className="p-1.5 hover:bg-emerald-50 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (!day)
                return <div key={`empty-${idx}`} className="p-2" />

              const isSelected =
                value &&
                new Date(value).getDate() === day &&
                new Date(value).getMonth() === currentDate.getMonth() &&
                new Date(value).getFullYear() === currentDate.getFullYear()

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all mx-auto cursor-pointer ${isSelected
                    ? "bg-emerald-500 text-white font-bold"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


export default function ReceiveProduceModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [receiveForm, setReceiveForm] = useState({
    docNo: "",
    note: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const [isDocOpen, setIsDocOpen] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

  const [pendingProductions, setPendingProductions] = useState<any[]>([])
  const [receivedAmount, setReceivedAmount] = useState<string>("")
  
  // 🌟 เพิ่ม State สำหรับวันหมดอายุ
  const [expireDate, setExpireDate] = useState("")
  const [noExpire, setNoExpire] = useState(false)

  const selectedPendingDoc = pendingProductions.find(p => p.docNo === receiveForm.docNo)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (docRef.current && !docRef.current.contains(event.target as Node)) {
        setIsDocOpen(false)
      }
    }

    if (isDocOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isDocOpen])

  useEffect(() => {
    if (selectedPendingDoc) {
      setReceivedAmount(selectedPendingDoc.amount.toString())
    }
  }, [selectedPendingDoc])

  useEffect(() => {
    if (open) {
      setIsFetching(true)
      fetch("/api/productions/pending")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPendingProductions(data)
          }
        })
        .catch(err => console.error("Fetch pending orders error:", err))
        .finally(() => setIsFetching(false))
    } else {
      setReceiveForm({ docNo: "", note: "" })
      setPendingProductions([])
      setExpireDate("")
      setNoExpire(false)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!receiveForm.docNo) return toast.error("กรุณาเลือกเลขที่ใบสั่งผลิต")
    if (!receivedAmount || Number(receivedAmount) <= 0) return toast.error("กรุณาระบุจำนวนที่รับเข้าให้ถูกต้อง")
    // 🌟 ดักจับ Validate วันหมดอายุ
    if (!noExpire && !expireDate) return toast.error("กรุณาระบุวันหมดอายุ หรือเลือก 'ไม่มีวันหมดอายุ'")

    setIsLoading(true)
    try {
      const res = await fetch("/api/productions/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docNo: receiveForm.docNo,
          note: receiveForm.note,
          receivedAmount: Number(receivedAmount), // 🌟 ส่งยอดที่รับเข้าจริงไปด้วย
          expireDate: noExpire ? null : (expireDate || null) // 🌟 ส่งวันหมดอายุไปให้ API
        })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || data.message || "เกิดข้อผิดพลาดในการรับเข้าสต๊อก")

      toast.success(`รับเข้าสินค้าบิล ${receiveForm.docNo} เรียบร้อยแล้ว`)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-2xl px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50 shrink-0">
          <div className="flex items-center gap-2 text-emerald-600">
            <PackagePlus className="w-5 h-5" />
            <h2 className="text-lg font-bold">รับเข้าสินค้าสำเร็จรูป</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-xl text-sm text-emerald-800 leading-relaxed font-medium">
            กรุณาเลือก <b className="text-emerald-900">"เลขที่ใบสั่งผลิต"</b> เพื่อยืนยันว่าผลิตเสร็จแล้ว ระบบจะเพิ่มสินค้าเข้าสต๊อกอัตโนมัติ
          </div>

          {/* เลือกใบสั่งผลิต */}
          <div className="space-y-2 relative z-50" ref={docRef}>
            <label className="block text-sm font-bold text-gray-700">
              เลือกเลขที่ใบสั่งผลิต (ที่ค้างอยู่) <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => !isFetching && setIsDocOpen(!isDocOpen)}
                className={`w-full flex items-center justify-between border ${isDocOpen
                    ? "ring-2 ring-emerald-500"
                    : "border-gray-200 hover:border-emerald-300"
                  } rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-all cursor-pointer text-left disabled:opacity-50`}
                disabled={isFetching}
              >
                <span
                  className={
                    receiveForm.docNo
                      ? "text-gray-800 font-bold"
                      : "text-gray-400 font-medium"
                  }
                >
                  {isFetching
                    ? "กำลังโหลดข้อมูล..."
                    : receiveForm.docNo
                      ? `${selectedPendingDoc?.docNo} - ${selectedPendingDoc?.productName}`
                      : "-- เลือกเลขที่เอกสาร --"}
                </span>

                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDocOpen ? "rotate-180 text-emerald-500" : ""
                    }`}
                />
              </button>

              {isDocOpen && !isFetching && (
                <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1.5">
                    {pendingProductions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        ไม่มีรายการค้างรับเข้า
                      </div>
                    ) : (
                      pendingProductions.map((doc: any) => {
                        const isSelected = receiveForm.docNo === doc.docNo

                        return (
                          <button
                            key={doc.docNo}
                            type="button"
                            onClick={() => {
                              setReceiveForm({
                                ...receiveForm,
                                docNo: doc.docNo,
                              })
                              setIsDocOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex justify-between items-center ${isSelected
                                ? "bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-500"
                                : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                              }`}
                          >
                            <span>
                              {doc.docNo} - {doc.productName}
                            </span>

                            <span
                              className={`text-xs px-2.5 py-1 rounded-full font-bold ${isSelected
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-500"
                                }`}
                            >
                              {doc.amount} ชิ้น
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

          {/* ข้อมูลการรับเข้า */}
          {selectedPendingDoc && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex gap-1 mb-2">
                  <label className="block text-sm font-bold text-gray-800">
                    จำนวนที่ผลิตได้จริง
                  </label>
                  <label className="block text-sm font-bold text-emerald-600">
                    (ยอดสั่ง: {selectedPendingDoc.amount})
                  </label>
                </div>

                <input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-white transition-all font-medium"
                />
                {Number(receivedAmount) < selectedPendingDoc.amount && (
                  <p className="text-[11px] text-red-500 mt-1 font-bold">
                    * น้อยกว่ายอดสั่งผลิต {selectedPendingDoc.amount - Number(receivedAmount)} ชิ้น (วัตถุดิบที่เบิกไปแล้วจะไม่คืนสต๊อก)
                  </p>
                )}
              </div>

              {/* 🌟 ส่วนวันหมดอายุที่เพิ่มเข้ามาใหม่ */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">
                      วันหมดอายุ
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !noExpire;
                        setNoExpire(next);
                        if (next) {
                          setExpireDate("");
                        } else {
                          const today = new Date();
                          const yyyy = today.getFullYear();
                          const mm = String(today.getMonth() + 1).padStart(2, "0");
                          const dd = String(today.getDate()).padStart(2, "0");
                          setExpireDate(`${yyyy}-${mm}-${dd}`);
                        }
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${noExpire ? "bg-emerald-500" : "bg-gray-300"}`}>
                        <span className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${noExpire ? "translate-x-5" : "translate-x-0"}`} />
                      </span>
                      <span className="text-xs font-bold text-gray-500">
                        ไม่มีวันหมดอายุ
                      </span>
                    </button>
                  </div>

                  {!noExpire ? (
                    <CustomDatePicker
                      value={expireDate}
                      onChange={(val) => setExpireDate(val)}
                    />
                  ) : (
                    <div className="w-full bg-white/60 border border-dashed border-emerald-200 rounded-xl px-4 py-3 text-center text-xs text-emerald-600/70 font-medium">
                      สินค้าล็อตนี้ไม่มีวันหมดอายุ
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
                <input
                  type="text"
                  value={receiveForm.note}
                  onChange={e => setReceiveForm({ ...receiveForm, note: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white bg-gray-50 transition-all font-medium"
                  placeholder="เช่น ตรวจสอบคุณภาพแล้วผ่าน 100%"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="rounded-2xl px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
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
            disabled={isLoading || !receiveForm.docNo || isFetching}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "ยืนยันรับเข้าสต๊อก"}
          </button>
        </div>
      </div>
    </div>
  )
}