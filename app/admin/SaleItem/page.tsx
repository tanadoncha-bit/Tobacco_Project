import prisma from "@/utils/db"
import OrderTable from "@/components/admin/orders/OrderTable"
import { SquareChartGantt, Clock, Truck, CheckCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
      items: {
        include: {
          variant: {
            include: {
              product: { include: { images: true } },
              values: { include: { optionValue: true } }
            }
          }
        }
      }
    },
  })

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    orderNumber: `ORD-${order.id.substring(0, 8).toUpperCase()}`,
    customerName: `${order.profile.firstname} ${order.profile.lastname}`,
    phone: order.profile.phonenumber || "ไม่ได้ระบุเบอร์โทร",
    address: order.profile.address || "ไม่ได้ระบุที่อยู่จัดส่ง",
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.createdAt,
    trackingNumber: order.trackingNumber || "",
    slipImage: order.slipImage || null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.variant.product.Pname,
      imageUrl: item.variant.product.images[0]?.url || null,
      variantText: item.variant.values.map(v => v.optionValue.value).join(", "),
      price: item.price,
      quantity: item.quantity,
    }))
  }))

  const totalOrders    = formattedOrders.length
  const pendingOrders  = formattedOrders.filter(o => ["PENDING", "VERIFYING"].includes(o.status)).length
  const shippingOrders = formattedOrders.filter(o => ["PAID", "SHIPPED"].includes(o.status)).length
  const doneOrders     = formattedOrders.filter(o => o.status === "COMPLETED").length

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <SquareChartGantt className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Orders Management</h1>
          <p className="text-[16px] text-gray-500 font-medium mt-1">จัดการรายการคำสั่งซื้อ สถานะ และตรวจสอบพัสดุที่ต้องจัดส่ง</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ออเดอร์ทั้งหมด", value: totalOrders,    icon: <SquareChartGantt className="w-4 h-4 md:w-6 md:h-6" />, gradient: "from-indigo-500 to-purple-600", shadow: "shadow-purple-200" },
          { label: "รอดำเนินการ",    value: pendingOrders,  icon: <Clock className="w-4 h-4 md:w-6 md:h-6" />,            gradient: "from-orange-400 to-amber-500",  shadow: "shadow-orange-200" },
          { label: "กำลังจัดส่ง",    value: shippingOrders, icon: <Truck className="w-4 h-4 md:w-6 md:h-6" />,            gradient: "from-blue-400 to-indigo-500",   shadow: "shadow-blue-200"   },
          { label: "เสร็จสิ้น",       value: doneOrders,     icon: <CheckCircle className="w-4 h-4 md:w-6 md:h-6" />,      gradient: "from-emerald-400 to-teal-500",  shadow: "shadow-emerald-200"},
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-3 md:p-6 flex items-center gap-3 md:gap-5 group">
            <div className={`bg-gradient-to-br ${card.gradient} rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] md:text-sm text-gray-500 font-bold mb-0.5 md:mb-1 leading-tight">{card.label}</p>
              <p className="text-xl md:text-3xl font-black text-gray-900">{card.value} <span className="text-xs md:text-base font-semibold text-gray-400">รายการ</span></p>
            </div>
          </div>
        ))}
      </div>

      <OrderTable initialOrders={formattedOrders} />
    </div>
  )
}