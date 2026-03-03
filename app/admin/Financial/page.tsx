import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react"
import prisma from "@/utils/db"
import FinanceTable from "@/components/admin/FinanceTable"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const incomeAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { status: { not: "CANCELLED" } }
  })
  const totalIncome = incomeAgg._sum.totalAmount || 0

  const materialExpenseAgg = await prisma.materialTransaction.aggregate({
    _sum: { totalCost: true },
    where: { type: "IN", totalCost: { not: null } }
  })

  const wasteLots = await prisma.stockTransaction.findMany({
    where: { type: "ADJUST_OUT", reason: { in: ["EXPIRED", "DAMAGED"] } },
    include: { variantLot: true }
  })
  const wasteExpense = wasteLots.reduce((sum, tx) => {
    return sum + ((tx.variantLot?.unitCost || 0) * tx.amount)
  }, 0)

  const totalExpense = (materialExpenseAgg._sum.totalCost || 0) + wasteExpense
  const profit = totalIncome - totalExpense

  const recentOrders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
  })

  const recentMaterials = await prisma.materialTransaction.findMany({
    where: { type: "IN", totalCost: { not: null } },
    orderBy: { createdAt: "desc" },
    include: { material: true }
  })

  const recentWaste = await prisma.stockTransaction.findMany({
    where: { type: "ADJUST_OUT", reason: { in: ["EXPIRED", "DAMAGED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      variantLot: {
        include: { variant: { include: { product: true } } }
      }
    }
  })

  const combinedTransactions = [
    ...recentOrders.map(order => ({
      uniqueKey: `ORD-TX-${order.id}`,
      displayCode: `ORD-${order.id.substring(0, 8).toUpperCase()}`,
      date: order.createdAt,
      description: `ขายสินค้า (ออเดอร์)`,
      type: "income",
      subtype: "sale",
      amount: order.totalAmount
    })),
    ...recentMaterials.map(mat => ({
      uniqueKey: `MAT-TX-${mat.id}`,
      displayCode: mat.material?.code || `MAT-${mat.id}`,
      date: mat.createdAt,
      description: `สั่งซื้อวัตถุดิบ (${mat.material?.name || "ไม่ระบุ"})`,
      type: "expense",
      subtype: "material",
      amount: mat.totalCost || 0
    })),
    ...recentWaste.map(tx => ({
      uniqueKey: `WASTE-TX-${tx.id}`,
      displayCode: tx.variantLot?.lotNumber || "-",
      date: tx.createdAt,
      description: `${tx.reason === "EXPIRED" ? "ตัดของหมดอายุ" : "ตัดของชำรุด"} (${tx.variantLot?.variant?.product?.Pname || "ไม่ระบุ"})`,
      type: "expense",
      subtype: tx.reason === "EXPIRED" ? "expired" : "damaged",
      amount: (tx.variantLot?.unitCost || 0) * tx.amount
    }))
  ]

  combinedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())

  const cards = [
    {
      label: "รายรับทั้งหมด (Income)",
      value: totalIncome,
      emptyText: "ยังไม่มีรายรับ",
      valueColor: "text-emerald-600",
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: "from-emerald-400 to-teal-500",
      shadow: "shadow-emerald-200",
      sub: null,
    },
    {
      label: "รายจ่ายรวม (Expenses)",
      value: totalExpense,
      emptyText: "ยังไม่มีรายจ่าย",
      valueColor: "text-rose-600",
      icon: <TrendingDown className="w-6 h-6" />,
      gradient: "from-rose-500 to-red-600",
      shadow: "shadow-rose-200",
      sub: wasteExpense > 0
        ? `รวมของเสีย ฿${wasteExpense.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`
        : null,
    },
    {
      label: "กำไรสุทธิ (Net Profit)",
      value: totalIncome === 0 && totalExpense === 0 ? null : profit,
      emptyText: "ยังไม่มีข้อมูล",
      valueColor: profit >= 0 ? "text-indigo-600" : "text-rose-600",
      icon: <DollarSign className="w-6 h-6" />,
      gradient: "from-indigo-500 to-purple-600",
      shadow: "shadow-purple-200",
      sub: null,
    },
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Financial Dashboard</h1>
          <p className="text-[16px] text-gray-500 font-medium mt-1">ภาพรวมการเงินและประวัติการทำรายการล่าสุดของร้าน</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map(card => (
          <div
            key={card.label}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group"
          >
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 font-bold mb-1 truncate">{card.label}</p>
              {card.value === null ? (
                <p className="text-xl font-black text-gray-300">{card.emptyText}</p>
              ) : card.value === 0 ? (
                <p className="text-xl font-black text-gray-300">{card.emptyText}</p>
              ) : (
                <p className={`text-3xl font-black ${card.valueColor}`}>
                  ฿{card.value.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </p>
              )}
              {card.sub && (
                <p className="text-xs text-rose-400 mt-1 font-medium">{card.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <FinanceTable transactions={combinedTransactions} />
      </div>
    </div>
  )
}