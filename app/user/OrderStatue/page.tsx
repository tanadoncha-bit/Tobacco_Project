import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import OrderListClient from "./OrderListClient"

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

  // 2. ดึงข้อมูลการตั้งค่าช่องทางการชำระเงินจาก Database
  // **หมายเหตุ: เปลี่ยน prisma.setting เป็นชื่อ Table ที่คุณใช้เก็บตั้งค่าร้านค้านะครับ**
  const storeSetting = await prisma.storeSetting.findFirst()

  // 3. แมพข้อมูลเตรียมส่งให้ Client Component
  const paymentSettings = {
    bankName: storeSetting?.bankName || "ไม่ระบุธนาคาร",
    accountNumber: storeSetting?.accountNumber || "ไม่ระบุเลขบัญชี",
    accountName: storeSetting?.accountName || "ไม่ระบุชื่อบัญชี"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">ประวัติการสั่งซื้อของคุณ</h1>

      {/* 4. โยนข้อมูล orders และ paymentSettings ไปให้ Component ลูกจัดการแสดงผล */}
      <OrderListClient
        orders={orders}
        paymentSettings={paymentSettings}
      />
    </div>
  )
}