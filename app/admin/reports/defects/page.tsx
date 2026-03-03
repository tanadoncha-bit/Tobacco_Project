"use client"

import { useState, useEffect, useMemo } from "react"
import { AlertCircle, Search, Clock, Package, History, Trash2, TrendingDown, AlertTriangle } from "lucide-react"
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

    const fetchData = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const [historyRes, expiredRes] = await Promise.all([
                fetch("/api/reports/defects"),
                fetch("/api/inventory/expired")
            ])

            if (!historyRes.ok || !expiredRes.ok) {
                throw new Error("Failed to fetch data")
            }

            const hJson = await historyRes.json()
            const eJson = await expiredRes.json()

            const onlyExpiredHistory = hJson.data?.filter((item: any) => item.reason === "EXPIRED") || []

            setHistoryData(onlyExpiredHistory)
            setCurrentExpired(eJson.data || [])

        } catch (error) {
            console.error("Failed to fetch:", error)
            setError("ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredData = useMemo(() => {
        const sourceData = activeTab === "current" ? currentExpired : historyData
        if (!searchTerm) return sourceData

        const lowerSearchTerm = searchTerm.toLowerCase()
        return sourceData.filter(item => {
            const name = item.name || ""
            const lot = item.lotNumber || ""
            return name.toLowerCase().includes(lowerSearchTerm) ||
                lot.toLowerCase().includes(lowerSearchTerm)
        })
    }, [activeTab, currentExpired, historyData, searchTerm])

    const totalLossValue = useMemo(() => {
        return filteredData.reduce((sum, item) => {
            const cost = item.unitCost || 0
            const amount = Math.abs(item.amount || item.stock || 0)
            return sum + (cost * amount)
        }, 0)
    }, [filteredData])

    if (isLoading) return <GlobalLoading />

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Error Message */}
            {error && (
                <div className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-rose-500 to-red-600 p-3 rounded-2xl shadow-lg shadow-red-200">
                            <AlertCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">รายงานสินค้าหมดอายุ</h1>
                            <p className="text-[16px] text-gray-500 font-medium mt-1">วิเคราะห์และบริหารจัดการสินค้าเสื่อมสภาพเพื่อลดต้นทุนแฝง</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
                    <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-4 shadow-lg shadow-orange-200 text-white group-hover:scale-110 transition-transform duration-300">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">ค้างสต๊อกปัจจุบัน</p>
                        <p className="text-3xl font-black text-gray-900">{currentExpired.length} <span className="text-base font-semibold text-gray-400">รายการ</span></p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg shadow-indigo-200 text-white group-hover:scale-110 transition-transform duration-300">
                        <History className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">ประวัติการตัดทิ้ง</p>
                        <p className="text-3xl font-black text-gray-900">{historyData.length} <span className="text-base font-semibold text-gray-400">รายการ</span></p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
                    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-4 shadow-lg shadow-rose-200 text-white group-hover:scale-110 transition-transform duration-300">
                        <TrendingDown className="w-6 h-6" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm text-gray-500 font-bold mb-1 truncate">
                            {activeTab === 'current' ? 'มูลค่าความเสี่ยงปัจจุบัน' : 'รวมความเสียหายที่เกิดขึ้น'}
                        </p>
                        <p className="text-3xl font-black text-rose-600 truncate">
                            ฿ {totalLossValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="ค้นหาสินค้า หรือ Lot..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
                        />
                    </div>

                    <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner">
                        <button
                            onClick={() => setActiveTab("current")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "current"
                                ? "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                                }`}
                        >
                            <Package className="w-4 h-4" />
                            ค้างสต๊อก
                            <span className={`py-0.5 px-2 rounded-full text-[10px] ml-0.5 ${activeTab === "current" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                                }`}>
                                {currentExpired.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab("history")}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "history"
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-purple-200/50"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                                }`}
                        >
                            <History className="w-4 h-4" />
                            ประวัติ
                            <span className={`py-0.5 px-2 rounded-full text-[10px] ml-0.5 ${activeTab === "history" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"
                                }`}>
                                {historyData.length}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    {activeTab === "current" ? "วันที่หมดอายุ" : "วันที่ตัดจ่าย"}
                                </th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">ชื่อสินค้า / วัตถุดิบ</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">หมายเลข Lot</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">จำนวน</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">มูลค่าความเสียหาย</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">จัดการ</th>
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
                            ) : (
                                filteredData.map((item) => {
                                    const cost = item.unitCost || 0
                                    const qty = Math.abs(item.amount || item.stock || 0)
                                    const totalDamage = cost * qty
                                    const displayDate = item.expireDate || item.createdAt || new Date().toISOString()

                                    return (
                                        <tr key={item.id} className="hover:bg-rose-50/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100/50">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="font-bold text-sm whitespace-nowrap">
                                                        {new Date(displayDate).toLocaleDateString("th-TH")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-black text-gray-900 text-base">{item.name}</p>
                                                {item.category && (
                                                    <p className="text-xs font-medium text-gray-500 mt-1 flex items-center justify-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                        {item.category}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-mono text-sm font-semibold bg-gray-100/80 text-gray-700 px-3 py-1.5 rounded-xl">
                                                    {item.lotNumber || "ไม่มี Lot"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <span className="font-black text-gray-900 text-base">{qty.toLocaleString()}</span>
                                                    <span className="text-gray-400 text-xs font-medium">ชิ้น</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`font-black text-base ${totalDamage > 0 ? "text-rose-600" : "text-gray-400"}`}>
                                                    ฿{totalDamage.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {activeTab === "current" ? (
                                                    <button
                                                        onClick={() => setCutItem(item)}
                                                        className="inline-flex items-center gap-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-rose-200 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> ตัดทิ้ง
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                        ตัดจ่ายแล้ว
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {filteredData.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                            แสดงผลทั้งหมด <strong className="text-gray-900">{filteredData.length}</strong> รายการ
                        </span>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                            <span className="text-sm font-bold text-gray-600">มูลค่ารวม:</span>
                            <span className="text-lg font-black text-rose-600">
                                ฿ {totalLossValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
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