"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { AlertCircle, Search, Clock, Package, History, Trash2, TrendingDown, AlertTriangle, ChevronDown } from "lucide-react"
import GlobalLoading from "../../loading"
import CutExpiredModal from "@/components/admin/CutExpiredModal"

export default function ExpiredReportPage() {
    const [activeTab, setActiveTab] = useState<"current" | "history">("current")
    const [historyData, setHistoryData] = useState<any[]>([])
    const [currentExpired, setCurrentExpired] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [cutItem, setCutItem] = useState<any | null>(null)
    const [tabOpen, setTabOpen] = useState(false)
    const tabRef = useRef<HTMLDivElement>(null)

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [historyRes, expiredRes] = await Promise.all([
                fetch("/api/reports/defects"),
                fetch("/api/inventory/expired")
            ])
            if (!historyRes.ok || !expiredRes.ok) throw new Error("Failed to fetch data")
            const hJson = await historyRes.json()
            const eJson = await expiredRes.json()
            setHistoryData(hJson.data?.filter((item: any) => item.reason === "EXPIRED" || item.reason === "DAMAGED") || [])
            setCurrentExpired(eJson.data || [])
        } catch (error) {
            setError("ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (tabRef.current && !tabRef.current.contains(e.target as Node)) setTabOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const filteredData = useMemo(() => {
        const sourceData = activeTab === "current" ? currentExpired : historyData
        if (!searchTerm) return sourceData
        const lower = searchTerm.toLowerCase()
        return sourceData.filter(item =>
            (item.name || "").toLowerCase().includes(lower) ||
            (item.lotNumber || "").toLowerCase().includes(lower)
        )
    }, [activeTab, currentExpired, historyData, searchTerm])

    const totalLossValue = useMemo(() =>
        filteredData.reduce((sum, item) => sum + (item.unitCost || 0) * Math.abs(item.amount || item.stock || 0), 0)
        , [filteredData])

    if (isLoading) return <GlobalLoading />

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {error && (
                <div className="bg-red-50/80 border-l-4 border-red-500 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-rose-500 to-red-600 p-3 rounded-2xl shadow-lg shadow-red-200">
                    <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">รายงานสินค้าหมดอายุ</h1>
                    <p className="text-[16px] text-gray-500 font-medium mt-1">วิเคราะห์และบริหารจัดการสินค้าเสื่อมสภาพ</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-5">
                {[
                    {
                        label: "ค้างสต๊อกปัจจุบัน", value: currentExpired.length, unit: "รายการ",
                        icon: <Package className="w-6 h-6" />,
                        gradient: "from-orange-400 to-amber-500", shadow: "shadow-orange-200",
                    },
                    {
                        label: "ประวัติการตัดทิ้ง", value: historyData.length, unit: "รายการ",
                        icon: <History className="w-6 h-6" />,
                        gradient: "from-indigo-500 to-purple-600", shadow: "shadow-indigo-200",
                    },
                    {
                        label: activeTab === "current" ? "มูลค่าความเสี่ยง" : "รวมความเสียหาย",
                        value: `฿${totalLossValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`,
                        unit: null,
                        icon: <TrendingDown className="w-6 h-6" />,
                        gradient: "from-rose-500 to-red-600", shadow: "shadow-rose-200",
                    },
                ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-3 md:p-6 flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-5 group">
                        <div className={`bg-gradient-to-br ${card.gradient} rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                            {card.icon}
                        </div>
                        <div className="text-center md:text-left min-w-0">
                            <p className="text-[11px] md:text-sm text-gray-500 font-bold mt-1 mb-0.5 md:mb-1 leading-tight">{card.label}</p>
                            <p className="text-lg md:text-3xl font-black text-gray-900 truncate">
                                {card.value}
                                {card.unit && <span className="text-xs md:text-base font-semibold text-gray-400 ml-1">{card.unit}</span>}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100">

                {/* Toolbar */}
                <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/30 space-y-3">

                    {/* Mobile: search + tab dropdown */}
                    <div className="flex gap-2 md:hidden">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-rose-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="ค้นหาสินค้า หรือ Lot..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 bg-white transition-all shadow-sm"
                            />
                        </div>
                        <div className="relative shrink-0" ref={tabRef}>
                            <button
                                onClick={() => setTabOpen(!tabOpen)}
                                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-bold text-gray-700 shadow-sm cursor-pointer whitespace-nowrap"
                            >
                                {activeTab === "current" ? "ค้างสต๊อก" : "ประวัติ"}
                                <span className="text-xs text-gray-400">{activeTab === "current" ? currentExpired.length : historyData.length}</span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${tabOpen ? "rotate-180" : ""}`} />
                            </button>
                            {tabOpen && (
                                <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                    <button
                                        onClick={() => { setActiveTab("current"); setTabOpen(false) }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer ${activeTab === "current" ? "bg-rose-50 text-rose-700 border-l-4 border-rose-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"}`}
                                    >
                                        ค้างสต๊อก <span className="text-xs text-gray-400">{currentExpired.length}</span>
                                    </button>
                                    <button
                                        onClick={() => { setActiveTab("history"); setTabOpen(false) }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer ${activeTab === "history" ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"}`}
                                    >
                                        ประวัติ <span className="text-xs text-gray-400">{historyData.length}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop: search + tab buttons */}
                    <div className="hidden md:flex items-center justify-between gap-3">
                        <div className="relative w-80 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-rose-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="ค้นหาสินค้า หรือ Lot..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 bg-white transition-all shadow-sm"
                            />
                        </div>
                        <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner">
                            <button
                                onClick={() => setActiveTab("current")}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${activeTab === "current" ? "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"}`}
                            >
                                <Package className="w-4 h-4" /> ค้างสต๊อก
                                <span className={`py-0.5 px-2 rounded-full text-[10px] ${activeTab === "current" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>{currentExpired.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${activeTab === "history" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md" : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"}`}
                            >
                                <History className="w-4 h-4" /> ประวัติ
                                <span className={`py-0.5 px-2 rounded-full text-[10px] ${activeTab === "history" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>{historyData.length}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {activeTab === "current" ? "วันหมดอายุ" : "วันที่ตัดจ่าย"}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">ชื่อสินค้า</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">หมายเลข Lot</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">จำนวน</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">มูลค่า</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                                                <Search className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold text-lg">ไม่พบข้อมูล</p>
                                                <p className="text-gray-400 font-medium mt-1">ไม่มีข้อมูลสินค้าหมดอายุในหมวดหมู่นี้</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.map(item => {
                                const cost = item.unitCost || 0
                                const qty = Math.abs(item.amount || item.stock || 0)
                                const totalDamage = cost * qty
                                const displayDate = item.expireDate || item.createdAt || new Date().toISOString()

                                return (
                                    <tr key={item.id} className="hover:bg-rose-50/30 transition-colors group">
                                        <td className="px-4 py-3">
                                            <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-xl border border-rose-100 whitespace-nowrap">
                                                <Clock className="w-3.5 h-3.5 shrink-0" />
                                                <span className="font-bold text-xs">
                                                    {new Date(displayDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-black text-gray-900 text-sm">{item.name}</p>
                                            {/* mobile sub-info */}
                                            <p className="md:hidden text-xs text-gray-400 font-medium mt-0.5">
                                                Lot: {item.lotNumber || "-"} · {qty.toLocaleString()} ชิ้น
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-xl">
                                                {item.lotNumber || "ไม่มี Lot"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center hidden md:table-cell">
                                            <span className="font-black text-gray-900 text-sm">{qty.toLocaleString()}</span>
                                            <span className="text-gray-400 text-xs ml-1">ชิ้น</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-black text-sm ${totalDamage > 0 ? "text-rose-600" : "text-gray-400"}`}>
                                                ฿{totalDamage.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {activeTab === "current" ? (
                                                <button
                                                    onClick={() => setCutItem(item)}
                                                    className="inline-flex items-center gap-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">ตัดทิ้ง</span>
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600 whitespace-nowrap">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                                                    ตัดแล้ว
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {filteredData.length > 0 && (
                    <div className="px-4 md:px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-row justify-between items-center gap-3 rounded-b-3xl">
                        <span className="text-sm font-medium text-gray-500">
                            <strong className="text-gray-900">{filteredData.length}</strong> รายการ
                        </span>
                        <div className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                            <span className="text-sm font-bold text-gray-600">มูลค่ารวม:</span>
                            <span className="text-base font-black text-rose-600">
                                ฿{totalLossValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <CutExpiredModal
                open={!!cutItem}
                item={cutItem}
                onClose={() => setCutItem(null)}
                onSuccess={() => { setCutItem(null); fetchData() }}
            />
        </div>
    )
}