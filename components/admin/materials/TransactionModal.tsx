import { useState, useEffect, useRef } from "react"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Package,
} from "lucide-react"

type MaterialLot = {
  id: number
  lotNumber: string
  stock: number
  costPerUnit: number | null
  receiveDate: Date | string
  expireDate: Date | string | null
}

type Material = {
  id: number
  code: string | null
  name: string
  stock: number
  unit: string
  costPerUnit: number | null
  MaterialLot?: MaterialLot[]
}

type TransactionForm = {
  amount: string
  note: string
  totalCost: string
  materialLotId: string
}

type Props = {
  isOpen: boolean
  mat: Material | null
  type: "IN" | "OUT"
  onClose: () => void
  txForm: TransactionForm
  setTxForm: (form: TransactionForm) => void
  lotNumber: string
  setLotNumber: (val: string) => void
  expireDate: string
  setExpireDate: (val: string) => void
  noExpire: boolean
  setNoExpire: (val: boolean) => void
  onSubmit: () => void
  isLoading: boolean
  // For showing real-time updated stock from parent state
  currentStock: number
  currentLots: MaterialLot[]
}

export default function TransactionModal({
  isOpen,
  mat,
  type,
  onClose,
  txForm,
  setTxForm,
  lotNumber,
  setLotNumber,
  expireDate,
  setExpireDate,
  noExpire,
  setNoExpire,
  onSubmit,
  isLoading,
  currentStock,
  currentLots,
}: Props) {
  const [isLotDropdownOpen, setIsLotDropdownOpen] = useState(false)

  // Close lot dropdown when modal closes
  useEffect(() => {
    if (!isOpen) setIsLotDropdownOpen(false)
  }, [isOpen])

  const handleClose = () => {
    setIsLotDropdownOpen(false)
    onClose()
  }

  if (!isOpen || !mat) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div
          className={`rounded-t-2xl px-6 py-4 border-b border-gray-100 flex justify-between items-center ${
            type === "IN" ? "bg-emerald-50/50" : "bg-red-50/50"
          }`}
        >
          <div className={`flex items-center gap-2 ${type === "IN" ? "text-emerald-700" : "text-red-700"}`}>
            {type === "IN" ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
            <h2 className="text-lg font-bold">
              {type === "IN" ? "รับเข้าวัตถุดิบ" : "เบิกออกวัตถุดิบ"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Material Info */}
          <div className="p-4 bg-gray-50/80 border border-gray-100 rounded-xl flex justify-between items-center">
            <span className="font-bold text-gray-900">{mat.name}</span>
            <span className="text-sm font-medium px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-600">
              คงเหลือรวม: {Number(currentStock).toFixed(2)} {mat.unit}
            </span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              จำนวนที่ต้องการ{type === "IN" ? "รับเข้า" : "เบิกออก"} ({mat.unit}) *
            </label>
            <input
              type="number"
              value={txForm.amount}
              onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
              placeholder="ใส่จำนวน..."
              className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:bg-white bg-gray-50 transition-all font-medium ${
                type === "IN" ? "focus:ring-emerald-500" : "focus:ring-red-500"
              }`}
            />
          </div>

          {/* IN-only fields */}
          {type === "IN" && (
            <div className="space-y-4 bg-emerald-50/30 p-4 -mx-2 rounded-xl border border-emerald-50">

              {/* Total Cost */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  ราคารวมล๊อตนี้ (฿) *
                </label>
                <input
                  type="number"
                  value={txForm.totalCost}
                  onChange={e => setTxForm({ ...txForm, totalCost: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all font-medium"
                  placeholder="0.00"
                />
              </div>

              {/* Lot Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  หมายเลข Lot (ไม่บังคับ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น LOT-001"
                  value={lotNumber}
                  onChange={e => setLotNumber(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white transition-all font-medium placeholder:text-gray-400"
                />
              </div>

              {/* Expire Date */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-gray-700">วันหมดอายุ</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !noExpire
                      setNoExpire(next)
                      if (next) {
                        setExpireDate("")
                      } else {
                        const today = new Date()
                        const yyyy = today.getFullYear()
                        const mm = String(today.getMonth() + 1).padStart(2, "0")
                        const dd = String(today.getDate()).padStart(2, "0")
                        setExpireDate(`${yyyy}-${mm}-${dd}`)
                      }
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
                        noExpire ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${
                          noExpire ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </span>
                    <span className="text-xs font-bold text-gray-500">ไม่มีวันหมดอายุ</span>
                  </button>
                </div>

                {!noExpire ? (
                  <CustomDatePicker value={expireDate} onChange={setExpireDate} />
                ) : (
                  <div className="w-full bg-white/50 border border-dashed border-emerald-200 rounded-xl px-4 py-3 text-center text-xs text-emerald-600/60 font-medium">
                    สินค้าไม่มีวันหมดอายุ
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OUT-only: Lot selector */}
          {type === "OUT" && (
            <div className="bg-red-50/30 p-4 rounded-2xl border border-red-100">
              <label className="block text-[11px] font-bold text-red-700 mb-2">เลือกล็อตที่ต้องการเบิก</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLotDropdownOpen(!isLotDropdownOpen)}
                  className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 flex justify-between items-center hover:border-red-400 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Package className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-900">
                        {txForm.materialLotId
                          ? currentLots.find(l => String(l.id) === String(txForm.materialLotId))?.lotNumber
                          : "ตัดอัตโนมัติ (FEFO)"}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {txForm.materialLotId ? "ล็อตที่ระบุ" : "ระบบจะหยิบของใกล้หมดอายุให้ก่อน"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${isLotDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isLotDropdownOpen && (
                  <div className="absolute z-[70] mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 animate-in slide-in-from-top-2">
                    <button
                      onClick={() => {
                        setTxForm({ ...txForm, materialLotId: "" })
                        setIsLotDropdownOpen(false)
                      }}
                      className={`w-full p-3 rounded-xl text-left hover:bg-red-50 transition-colors mb-1 cursor-pointer ${
                        !txForm.materialLotId ? "bg-red-50 border border-red-100" : ""
                      }`}
                    >
                      <p className="text-xs font-black text-red-600">ตัดอัตโนมัติ (FEFO)</p>
                      <p className="text-[10px] text-gray-500">ระบบจัดการลำดับการใช้ของให้อัตโนมัติ</p>
                    </button>
                    <div className="h-px bg-gray-50 my-1" />
                    {currentLots
                      .filter(l => Number(l.stock) > 0)
                      .map(lot => (
                        <button
                          key={lot.id}
                          onClick={() => {
                            setTxForm({ ...txForm, materialLotId: String(lot.id) })
                            setIsLotDropdownOpen(false)
                          }}
                          className={`w-full p-3 rounded-xl text-left hover:bg-gray-50 transition-colors flex justify-between items-center cursor-pointer ${
                            String(txForm.materialLotId) === String(lot.id)
                              ? "bg-emerald-50 border border-emerald-100"
                              : ""
                          }`}
                        >
                          <div>
                            <p className="text-xs font-bold text-gray-900">{lot.lotNumber}</p>
                            <p className="text-[10px] text-gray-500">
                              {lot.expireDate
                                ? `หมดอายุ: ${new Date(lot.expireDate).toLocaleDateString("th-TH")}`
                                : "ไม่มีวันหมดอายุ"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-gray-700">{Number(lot.stock).toFixed(2)}</p>
                            <p className="text-[10px] text-gray-400">{mat.unit}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
            <input
              type="text"
              value={txForm.note}
              onChange={e => setTxForm({ ...txForm, note: e.target.value })}
              className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:bg-white bg-gray-50 transition-all font-medium ${
                type === "IN" ? "focus:ring-emerald-500" : "focus:ring-red-500"
              }`}
              placeholder={type === "IN" ? "ระบุที่มาของสินค้า..." : "ระบุเหตุผลการเบิก..."}
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                type === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `ยืนยัน${type === "IN" ? "รับเข้า" : "เบิกออก"}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Custom Date Picker ────────────────────────────────────────────────────────

function CustomDatePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date>(value ? new Date(value) : new Date())
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setCurrentDate(new Date(value))
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const days = Array(firstDayOfMonth)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  const monthNames = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน",
    "พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม",
    "กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม",
  ]

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
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white flex justify-between items-center cursor-pointer font-medium text-gray-700 hover:border-emerald-300"
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>{displayValue}</span>
        <CalendarIcon className="w-4 h-4 text-emerald-600" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[280px] bg-white rounded-2xl shadow-lg border border-gray-100 p-4 z-[70]">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              className="p-1.5 hover:bg-emerald-50 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-gray-800 text-sm">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
            </div>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              className="p-1.5 hover:bg-emerald-50 rounded-lg"
            >
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
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all mx-auto cursor-pointer ${
                    isSelected ? "bg-emerald-500 text-white font-bold" : "text-gray-700 hover:bg-gray-100"
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