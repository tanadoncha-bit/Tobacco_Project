"use client"

import { useState, useEffect } from "react"
import { AlertCircle, Search, Clock, Package, History, Trash2, TrendingDown } from "lucide-react"

export default function ExpiredReportPage() {
    const [activeTab, setActiveTab] = useState<"current" | "history">("current")
    const [historyData, setHistoryData] = useState<any[]>([])
    const [currentExpired, setCurrentExpired] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const [historyRes, expiredRes] = await Promise.all([
                    fetch("/api/reports/defects"), // ดึงประวัติทั้งหมด
                    fetch("/api/inventory/expired") // ดึงของที่หมดอายุค้างสต๊อก
                ])

                if (historyRes.ok && expiredRes.ok) {
                    const hJson = await historyRes.json()
                    const eJson = await expiredRes.json()

                    const onlyExpiredHistory = hJson.data?.filter((item: any) => item.reason === "EXPIRED") || []

                    setHistoryData(onlyExpiredHistory)
                    setCurrentExpired(eJson.data || [])
                }
            } catch (error) {
                console.error("Failed to fetch:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredData = (activeTab === "current" ? currentExpired : historyData).filter(item => {
        const name = item.name || ""
        const lot = item.lotNumber || ""
        return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lot.toLowerCase().includes(searchTerm.toLowerCase())
    })

    const totalLossValue = filteredData.reduce((sum, item) => {
        const cost = item.unitCost || 0
        const amount = Math.abs(item.amount || item.stock || 0)
        return sum + (cost * amount)
    }, 0)

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                        รายงานสินค้าหมดอายุ
                    </h2>
                    <p className="text-gray-500 text-sm">ตรวจสอบของเสียสะสมและการบริหารจัดการสต๊อก</p>
                </div>

                <div className="bg-white border-2 border-red-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="bg-red-50 p-3 rounded-xl">
                        <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {activeTab === 'current' ? 'มูลค่าความเสี่ยงปัจจุบัน' : 'รวมความเสียหายที่เกิดขึ้น'}
                        </p>
                        <p className="text-2xl font-black text-red-600">
                            ฿ {totalLossValue.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("current")}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "current" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <Package className="w-4 h-4" />
                    ค้างสต๊อก ({currentExpired.length})
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${activeTab === "history" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <History className="w-4 h-4" />
                    ประวัติการตัดทิ้ง ({historyData.length})
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="ค้นหาสินค้า หรือ Lot..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
                />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50/50 text-gray-500 font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">{activeTab === 'current' ? 'หมดอายุเมื่อ' : 'วันที่ตัดจ่าย'}</th>
                                <th className="px-6 py-4">ชื่อสินค้า / วัตถุดิบ</th>
                                <th className="px-6 py-4">หมายเลข Lot</th>
                                <th className="px-6 py-4 text-center">จำนวน (ชิ้น)</th>
                                <th className="px-6 py-4">มูลค่าความเสียหาย</th>
                                <th className="px-6 py-4 text-right">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">กำลังดึงข้อมูล...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-400">ไม่มีข้อมูลสินค้าหมดอายุ</td></tr>
                            ) : (
                                filteredData.map((item) => {
                                    const cost = item.unitCost || 0
                                    const qty = Math.abs(item.amount || item.stock || 0)

                                    return (
                                        <tr key={item.id} className="hover:bg-red-50/20 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-red-600 font-bold">
                                                    <Clock className="w-4 h-4" />
                                                    {new Date(item.expireDate || item.createdAt).toLocaleDateString("th-TH")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 uppercase">
                                                    {item.lotNumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-black">
                                                {qty.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-red-600 font-bold">
                                                ฿ {(cost * qty).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {activeTab === 'current' ? (
                                                    <button className="bg-red-600 text-white p-2 rounded-lg hover:shadow-lg transition-all cursor-pointer">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Done</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}