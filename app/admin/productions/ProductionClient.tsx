"use client"

import { useState } from "react"
import { Factory, Search, X, Package, Hammer, ChevronRight, ClipboardList, AlertCircle } from "lucide-react"

type Order = {
    id: number
    docNo: string
    productName: string
    amount: number
    status: string
    note: string | null
    totalCost: number
    lots: string[]
    createdAt: Date
    materials: {
        name: string
        unit: string
        amount: number
        totalCost: number
    }[]
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: "กำลังผลิต", color: "bg-orange-100 text-orange-700 border-orange-300 shadow-sm" },
    COMPLETED: { label: "เสร็จแล้ว", color: "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm" },
    CANCELLED: { label: "ยกเลิก", color: "bg-rose-100 text-rose-700 border-rose-300 shadow-sm" },
}

export default function ProductionClient({ orders }: { orders: Order[] }) {
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED" | "CANCELLED">("ALL")
    const [selected, setSelected] = useState<Order | null>(null)

    const filtered = orders.filter(o => {
        const matchFilter = filter === "ALL" || o.status === filter
        const matchSearch =
            o.docNo.toLowerCase().includes(search.toLowerCase()) ||
            o.productName.toLowerCase().includes(search.toLowerCase())
        return matchFilter && matchSearch
    })

    const totalCostAll = filtered.reduce((sum, o) => sum + o.totalCost, 0)

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
                            <Factory className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">ใบสั่งผลิต</h1>
                            <p className="text-[16px] text-gray-500 font-medium mt-1">ประวัติและรายละเอียดการสั่งผลิตสินค้าทั้งหมด</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                    {
                        label: "ทั้งหมด",
                        value: orders.length,
                        unit: "ใบ",
                        icon: <ClipboardList className="w-6 h-6" />,
                        gradient: "from-blue-500 to-indigo-600",
                        shadow: "shadow-blue-200",
                    },
                    {
                        label: "กำลังผลิต",
                        value: orders.filter(o => o.status === "PENDING").length,
                        unit: "ใบ",
                        icon: <Factory className="w-6 h-6" />,
                        gradient: "from-orange-400 to-amber-500",
                        shadow: "shadow-orange-200",
                    },
                    {
                        label: "เสร็จแล้ว",
                        value: orders.filter(o => o.status === "COMPLETED").length,
                        unit: "ใบ",
                        icon: <Package className="w-6 h-6" />,
                        gradient: "from-emerald-400 to-teal-500",
                        shadow: "shadow-emerald-200",
                    },
                    {
                        label: "ยกเลิก",
                        value: orders.filter(o => o.status === "CANCELLED").length,
                        unit: "ใบ",
                        icon: <X className="w-6 h-6" />,
                        gradient: "from-rose-500 to-red-600",
                        shadow: "shadow-rose-200",
                    },
                ].map(card => (
                    <div
                        key={card.label}
                        className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group"
                    >
                        <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold mb-1">{card.label}</p>
                            <p className="text-3xl font-black text-gray-900">
                                {card.value} <span className="text-base font-semibold text-gray-400">{card.unit}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/30">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="ค้นหาเลขใบ, ชื่อสินค้า..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all shadow-sm"
                        />
                    </div>

                    <div className="inline-flex bg-gray-100/80 p-1.5 rounded-2xl items-center shadow-inner">
                        {(["ALL", "PENDING", "COMPLETED", "CANCELLED"] as const).map(s => {
                            const isActive = filter === s
                            let activeClass = ""
                            if (isActive) {
                                if (s === "ALL") activeClass = "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md"
                                else if (s === "PENDING") activeClass = "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-md"
                                else if (s === "COMPLETED") activeClass = "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md"
                                else if (s === "CANCELLED") activeClass = "bg-gradient-to-r from-rose-400 to-red-500 text-white shadow-md"
                            } else {
                                activeClass = "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                            }
                            const label = s === "ALL" ? "ทั้งหมด" : STATUS_MAP[s].label
                            const count = s === "ALL" ? orders.length : orders.filter(o => o.status === s).length

                            return (
                                <button
                                    key={s}
                                    onClick={() => setFilter(s)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${activeClass}`}
                                >
                                    {label}
                                    <span className={`py-0.5 px-2 rounded-full text-[10px] ml-0.5 ${isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">เลขใบสั่งผลิต</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">สินค้า</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">จำนวน</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">ต้นทุนวัตถุดิบ</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">สถานะ</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">วันที่</th>
                                <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase tracking-wider pl-12 whitespace-nowrap">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                                                <Search className="w-10 h-10 text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold text-lg">ไม่พบข้อมูล</p>
                                                <p className="text-gray-400 font-medium mt-1">ไม่มีข้อมูลใบสั่งผลิตในหมวดหมู่นี้</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(order => (
                                    <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-5">
                                            <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100 font-bold">
                                                {order.docNo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 min-w-[200px]">
                                            <p className="font-black text-gray-900 text-base group-hover:text-indigo-700 transition-colors">{order.productName}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="font-black text-gray-900 text-base">{order.amount.toLocaleString()}</span>
                                                <span className="text-gray-400 text-xs font-medium">ชิ้น</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`font-black text-base ${order.totalCost > 0 ? "text-indigo-600" : "text-gray-400"}`}>
                                                ฿{order.totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${STATUS_MAP[order.status]?.color}`}>
                                                {STATUS_MAP[order.status]?.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 text-xs font-medium whitespace-nowrap">
                                            {new Date(order.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => setSelected(order)}
                                                className="inline-flex items-center gap-2 bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-indigo-200 cursor-pointer"
                                            >
                                                รายละเอียด <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {filtered.length > 0 && (
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">
                            แสดงผลทั้งหมด <strong className="text-gray-900">{filtered.length}</strong> รายการ
                        </span>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                            <span className="text-sm font-bold text-gray-600">ต้นทุนรวมทั้งหมด:</span>
                            <span className="text-lg font-black text-indigo-600">
                                ฿ {totalCostAll.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden">

                        <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center">
                            <div className="flex items-center gap-3 text-white">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                    <Factory className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-wide">{selected.docNo}</h2>
                                    <p className="text-indigo-100 text-xs font-medium">รายละเอียดใบสั่งผลิต</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelected(null)}
                                className="text-white/70 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto bg-slate-50/50">

                            {/* Info */}
                            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-5 space-y-3">
                                {[
                                    { label: "สินค้า", value: <span className="text-sm font-black text-gray-800 bg-gray-100 px-3 py-1 rounded-lg">{selected.productName}</span> },
                                    { label: "จำนวนผลิต", value: <span className="text-sm font-bold text-gray-800">{selected.amount.toLocaleString()} <span className="text-xs text-gray-400">ชิ้น</span></span> },
                                    { label: "สถานะ", value: <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border shadow-sm ${STATUS_MAP[selected.status]?.color}`}>{STATUS_MAP[selected.status]?.label}</span> },
                                    { label: "วันที่สั่งผลิต", value: <span className="text-sm font-bold text-gray-800">{new Date(selected.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "long", year: "numeric" })}</span> },
                                ].map(row => (
                                    <div key={row.label} className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500 font-medium">{row.label}</span>
                                        {row.value}
                                    </div>
                                ))}
                                {selected.note && (
                                    <div className="pt-3 mt-3 border-t border-gray-100">
                                        <span className="block text-xs text-gray-500 font-bold mb-1">หมายเหตุ</span>
                                        <p className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg border border-amber-100">{selected.note}</p>
                                    </div>
                                )}
                            </div>

                            {/* Lots */}
                            {selected.lots.length > 0 && (
                                <div>
                                    <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Package className="w-4 h-4" /> Lot ที่ผลิตได้
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {selected.lots.map(lot => (
                                            <span key={lot} className="font-mono text-xs bg-gradient-to-r from-teal-400 to-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">
                                                {lot}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Materials */}
                            {selected.materials.length > 0 && (
                                <div>
                                    <p className="text-xs font-extrabold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Hammer className="w-4 h-4" /> วัตถุดิบที่ใช้
                                    </p>
                                    <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500">วัตถุดิบ</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500">จำนวน</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500">ต้นทุน</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {selected.materials.map((mat, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-4 py-3 font-bold text-gray-700">{mat.name}</td>
                                                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{mat.amount} <span className="text-xs">{mat.unit}</span></td>
                                                        <td className="px-4 py-3 text-right font-black text-indigo-600">
                                                            ฿{mat.totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Total Cost */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-purple-100 rounded-2xl px-6 py-5 flex justify-between items-center shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">ต้นทุนวัตถุดิบรวม</span>
                                    <span className="text-sm text-gray-500">ทั้งหมด {selected.materials.length} รายการ</span>
                                </div>
                                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-700">
                                    ฿{selected.totalCost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}