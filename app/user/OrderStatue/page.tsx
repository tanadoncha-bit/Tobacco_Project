import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import OrderListClient from "./OrderListClient"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrderStatusPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const [orders, storeSetting] = await Promise.all([
    prisma.order.findMany({
      where: { profileId: session.user.id },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { images: true } },
                values: { include: { optionValue: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.storeSetting.findFirst(),
  ])

  const paymentSettings = {
    bankName: storeSetting?.bankName || "ไม่ระบุธนาคาร",
    accountNumber: storeSetting?.accountNumber || "ไม่ระบุเลขบัญชี",
    accountName: storeSetting?.accountName || "ไม่ระบุชื่อบัญชี",
  }

  const storeSettings = {
    storeName: storeSetting?.storeName || "Tobacco Store",
    address: storeSetting?.address || "",
    phone: storeSetting?.phone || "",
    email: storeSetting?.email || "",
    bankName: storeSetting?.bankName || "ไม่ระบุธนาคาร",
    accountNumber: storeSetting?.accountNumber || "ไม่ระบุเลขบัญชี",
    accountName: storeSetting?.accountName || "ไม่ระบุชื่อบัญชี",
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">ประวัติการสั่งซื้อ</h1>
            <p className="text-[16px] text-gray-500 font-medium mt-1">ติดตามสถานะและรายละเอียดคำสั่งซื้อของคุณ</p>
          </div>
        </div>
        <OrderListClient
          orders={orders}
          paymentSettings={paymentSettings}
          storeSettings={storeSettings}
        />
      </div>
    </div>
  )
}