import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ShoppingBag, 
  Package,
  Wallet
} from "lucide-react"
import prisma from "@/utils/db"

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const incomeAgg = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { status: { not: "CANCELLED" } }
  })
  const totalIncome = incomeAgg._sum.totalAmount || 0

  const expenseAgg = await prisma.materialTransaction.aggregate({
    _sum: { totalCost: true },
    where: { 
      type: "IN", 
      totalCost: { not: null } 
    }
  })
  const totalExpense = expenseAgg._sum.totalCost || 0

  const profit = totalIncome - totalExpense

  const recentOrders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const recentMaterials = await prisma.materialTransaction.findMany({
    where: { type: "IN", totalCost: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { material: true }
  })

  const combinedTransactions = [
    ...recentOrders.map(order => ({
      id: `ORD-${order.id.substring(0, 8).toUpperCase()}`,
      date: order.createdAt,
      description: `ขายสินค้า (ออเดอร์)`,
      type: "income",
      amount: order.totalAmount
    })),
    ...recentMaterials.map(mat => ({
      id: `MAT-${mat.id}`,
      date: mat.createdAt,
      description: `สั่งซื้อวัตถุดิบ (${mat.material?.name || 'ไม่ระบุ'})`,
      type: "expense",
      amount: mat.totalCost || 0
    }))
  ]

  combinedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime())
  const displayTransactions = combinedTransactions.slice(0, 5)


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Wallet className="w-7 h-7 text-purple-600" /> Financial Dashboard
        </h1>
        <p className="text-gray-500 text-sm mt-1">ภาพรวมการเงินและประวัติการทำรายการล่าสุดของร้าน</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">รายรับทั้งหมด (Income)</p>
            <h2 className="text-3xl font-bold text-green-600">
              ฿{totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">รายจ่ายวัตถุดิบ (Expenses)</p>
            <h2 className="text-3xl font-bold text-red-500">
              ฿{totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className="bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] p-6 rounded-2xl shadow-md text-white flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">กำไรสุทธิ (Net Profit)</p>
            <h2 className="text-3xl font-bold">
              ฿{profit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </h2>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">ประวัติการเข้า-ออกของเงินล่าสุด</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b">
                <th className="px-6 py-4 font-medium">วันที่</th>
                <th className="px-6 py-4 font-medium">รหัสอ้างอิง</th>
                <th className="px-6 py-4 font-medium">รายการ</th>
                <th className="px-6 py-4 font-medium">ประเภท</th>
                <th className="px-6 py-4 font-medium text-right">จำนวนเงิน (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    ยังไม่มีประวัติการทำรายการในระบบ
                  </td>
                </tr>
              )}
              {displayTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {trx.date.toLocaleString('th-TH', { 
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute:'2-digit' 
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{trx.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    <div className="flex items-center gap-2">
                      {trx.type === "income" ? (
                        <ShoppingBag size={16} className="text-green-500" />
                      ) : (
                        <Package size={16} className="text-red-400" />
                      )}
                      {trx.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trx.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {trx.type === "income" ? "รายรับ (ขาย)" : "รายจ่าย (ทุน)"}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${
                    trx.type === "income" ? "text-green-600" : "text-red-500"
                  }`}>
                    {trx.type === "income" ? "+" : "-"}฿{trx.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}