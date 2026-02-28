"use client"

import { useState } from "react"
import { Search, ArrowDownToLine, ArrowUpFromLine, Package, Hammer, Filter, Calendar } from "lucide-react"
import dayjs from "dayjs" // อย่าลืมติดตั้ง npm install dayjs ถ้ายังไม่มี
import 'dayjs/locale/th'

dayjs.locale('th')

type Transaction = {
  id: string
  date: Date
  type: string
  category: string
  itemName: string
  amount: number
  unit: string
  totalCost: number | null
  note: string | null
  creatorName: string
  creatorImage: string | null
}

export const dynamic = "force-dynamic";

export default function HistoryClient({ initialData }: { initialData: Transaction[] }) {
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<"ALL" | "MATERIAL" | "PRODUCT">("ALL")
  const [filterType, setFilterType] = useState<"ALL" | "IN" | "OUT">("ALL")

  // กรองข้อมูลตามที่ผู้ใช้เลือก
  const filteredData = initialData.filter((tx) => {
    const matchSearch = tx.itemName.toLowerCase().includes(search.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(search.toLowerCase()))
    const matchCategory = filterCategory === "ALL" || tx.category === filterCategory
    const matchType = filterType === "ALL" || tx.type === filterType

    return matchSearch && matchCategory && matchType
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            Transactions History
          </h1>
          <p className="text-gray-500 text-sm mt-1">ความเคลื่อนไหวของวัตถุดิบและสต๊อกสินค้าทั้งหมดในระบบ</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ================= ตัวกรอง (Filters) ================= */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหาชื่อรายการ, หมายเหตุ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setFilterCategory("ALL")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterCategory === "ALL" ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterCategory("MATERIAL")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${filterCategory === "MATERIAL" ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Hammer className="w-3.5 h-3.5" /> วัตถุดิบ
              </button>
              <button
                onClick={() => setFilterCategory("PRODUCT")}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${filterCategory === "PRODUCT" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Package className="w-3.5 h-3.5" /> สินค้า
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterType === "ALL" ? "bg-gray-200 text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
              >
                เข้า/ออก
              </button>
              <button
                onClick={() => setFilterType("IN")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${filterType === "IN" ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <ArrowDownToLine className="w-3.5 h-3.5" /> รับเข้า
              </button>
              <button
                onClick={() => setFilterType("OUT")}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${filterType === "OUT" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <ArrowUpFromLine className="w-3.5 h-3.5" /> เบิกออก
              </button>
            </div>
          </div>
        </div>

        {/* ================= ตารางข้อมูล ================= */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 font-semibold border-b border-gray-100 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">วัน-เวลา</th>
                <th className="px-6 py-4">ประเภท</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 min-w-[200px]">ชื่อรายการ</th>
                <th className="px-6 py-4 text-right">จำนวน</th>
                <th className="px-6 py-4 min-w-[150px]">หมายเหตุ</th>
                <th className="px-6 py-4">ผู้ทำรายการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    <div className="font-medium text-gray-800">{dayjs(tx.date).format("DD MMM YYYY")}</div>
                    <div className="text-xs text-gray-400">{dayjs(tx.date).format("HH:mm น.")}</div>
                  </td>

                  <td className="px-6 py-4">
                    {tx.category === "MATERIAL" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-600 border border-orange-100">
                        <Hammer className="w-3 h-3" /> วัตถุดิบ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        <Package className="w-3 h-3" /> สินค้า
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {tx.type === "IN" ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-1 rounded-md text-xs">
                        <ArrowDownToLine className="w-3.5 h-3.5" /> รับเข้า
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md text-xs">
                        <ArrowUpFromLine className="w-3.5 h-3.5" /> ออก
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 font-semibold text-gray-800">{tx.itemName}</td>

                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold text-base ${tx.type === "IN" ? "text-green-600" : "text-red-600"}`}>
                      {tx.type === "IN" ? "+" : "-"}{tx.amount.toLocaleString()}
                    </span>
                    <span className="text-gray-400 text-xs ml-1">{tx.unit}</span>
                    {tx.totalCost && (
                      <div className="text-xs text-gray-400 mt-0.5">฿{tx.totalCost.toLocaleString()}</div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-gray-500 text-xs leading-relaxed">
                    {tx.note || <span className="text-gray-300">-</span>}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {tx.creatorImage ? (
                        <img
                          src={tx.creatorImage}
                          alt={tx.creatorName}
                          className="w-6 h-6 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold uppercase">
                          {tx.creatorName?.charAt(0) || "S"}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">{tx.creatorName}</span>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 bg-gray-50/50">
                    <Filter className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    ไม่พบประวัติการทำรายการที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}