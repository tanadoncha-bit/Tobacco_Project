"use client"

import { useState } from "react"
import { X, Trash2, Package, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

type Props = {
    open: boolean
    type?: "product" | "material"  // default = product
    item: {
        dbId: number
        name: string
        lotNumber: string
        stock: number
        unitCost: number
    } | null
    onClose: () => void
    onSuccess: () => void
}

export default function CutExpiredModal({ open, type = "product", item, onClose, onSuccess }: Props) {
    const [isLoading, setIsLoading] = useState(false)
    const [note, setNote] = useState("")

    if (!open || !item) return null

    const totalDamage = item.unitCost * item.stock
    const isMaterial = type === "material"

    const handleSubmit = async () => {
        setIsLoading(true)
        try {
            const url = isMaterial
                ? "/api/inventory/adjust-material"
                : "/api/inventory/adjust"

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    lotId: item.dbId,
                    amount: item.stock,
                    reason: "EXPIRED",
                    note: note || `ตัด${isMaterial ? "วัตถุดิบ" : "สินค้า"}หมดอายุ [Lot: ${item.lotNumber}]`
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "เกิดข้อผิดพลาด")
            }

            toast.success(`ตัด${isMaterial ? "วัตถุดิบ" : "สินค้า"} [${item.lotNumber}] เรียบร้อยแล้ว`)
            onSuccess()
            onClose()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-white/20 overflow-hidden relative">

                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rose-50/80 to-transparent pointer-events-none"></div>

                <div className="relative p-6 sm:p-8 space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4 items-center">
                            <div className="bg-gradient-to-br from-rose-500 to-red-600 p-3.5 rounded-2xl shadow-lg shadow-rose-200">
                                <Trash2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                    ตัด{isMaterial ? "วัตถุดิบ" : "สินค้า"}หมดอายุ
                                </h2>
                                <p className="text-sm font-medium text-gray-500 mt-0.5">
                                    ยืนยันการนำ{isMaterial ? "วัตถุดิบ" : "สินค้า"}ออกจากระบบคลัง
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 p-2 rounded-xl transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100/80 space-y-3 shadow-inner">
                        <div className="flex items-center gap-3 border-b border-gray-200/60 pb-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                <Package className="w-5 h-5 text-gray-500" />
                            </div>
                            <span className="font-black text-gray-900 text-lg truncate">{item.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-gray-500 font-medium">หมายเลข Lot</span>
                            <span className="font-mono font-bold text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-gray-700 shadow-sm">
                                {item.lotNumber}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1">
                            <span className="text-gray-500 font-medium">จำนวนที่จะตัดทิ้ง</span>
                            <div className="flex items-center gap-1.5 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                                <span className="font-black text-rose-600 text-base">{item.stock}</span>
                                <span className="text-rose-500 font-semibold text-xs">
                                    {isMaterial ? "หน่วย" : "ชิ้น"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Damage Summary */}
                    <div className="bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-100 rounded-2xl p-5 flex items-center gap-4">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-rose-100 shrink-0">
                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-xs text-rose-500 font-bold mb-0.5">มูลค่าความเสียหายที่เกิดขึ้น</p>
                            <p className="text-2xl font-black text-rose-600 tracking-tight">
                                ฿ {totalDamage.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="space-y-2.5">
                        <label className="block text-sm font-bold text-gray-700 ml-1">หมายเหตุ (ถ้ามี)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder={`ตัด${isMaterial ? "วัตถุดิบ" : "สินค้า"}หมดอายุ [Lot: ${item.lotNumber}]`}
                            className="w-full border border-gray-200 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 bg-gray-50 focus:bg-white transition-all font-medium shadow-sm"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all duration-300 cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-[1.5] py-3.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-200/50 hover:shadow-xl hover:shadow-rose-200 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer transform active:scale-[0.98]"
                        >
                            {isLoading
                                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <><Trash2 className="w-5 h-5" /> ยืนยันการตัดทิ้ง</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}