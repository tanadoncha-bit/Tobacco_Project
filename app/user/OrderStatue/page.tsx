import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import OrderListClient from "./OrderListClient"
import { PackageSearch } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0 // กันแคช

export default async function OrderStatusPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  // 1. ดึงข้อมูล Profile และออเดอร์
  const orders = await prisma.order.findMany({
    where: { profileId: session.user.id },
    include: {
      profile: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
              values: {
                include: { optionValue: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
  })

  const storeSetting = await prisma.storeSetting.findFirst()

  const paymentSettings = {
    bankName: storeSetting?.bankName || "ไม่ระบุธนาคาร",
    accountNumber: storeSetting?.accountNumber || "ไม่ระบุเลขบัญชี",
    accountName: storeSetting?.accountName || "ไม่ระบุชื่อบัญชี"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <PackageSearch className="w-8 h-8 text-purple-700" />
        <h1 className="text-3xl font-bold text-gray-800">ประวัติการสั่งซื้อของคุณ</h1>
      </div>
      <OrderListClient
        orders={orders}
        paymentSettings={paymentSettings}
      />
    </div>
  )
}