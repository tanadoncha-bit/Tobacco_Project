export const dynamic = "force-dynamic";

import prisma from "@/utils/db"
import OrderTable from "@/components/admin/OrderTable"
import { SquareChartGantt } from "lucide-react"

export default async function OrdersPage() {
  // ดึงข้อมูลออเดอร์ทั้งหมด พร้อมของที่สั่งและข้อมูลลูกค้า
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      profile: true,
      items: {
        include: {
          variant: {
            include: {
              product: {
                include: { images: true }
              },
              values: {
                include: { optionValue: true }
              }
            }
          }
        }
      }
    },
  })

  // จัดฟอร์แมตข้อมูลส่งไปให้ตาราง
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

  return (
    <div className="p-6">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <SquareChartGantt className="w-7 h-7 text-purple-600" />
            Orders Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">จัดการรายการคำสั่งซื้อ สถานะคำสั่งซื้อ และตรวจสอบพัสดุที่ต้องจัดส่ง</p>
        </div>
      </div>

      <OrderTable initialOrders={formattedOrders} />
    </div>
  )
}