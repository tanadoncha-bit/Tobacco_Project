import { Wrench } from "lucide-react"
import prisma from "@/utils/db"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export default async function MaintenancePage() {
  
  const settings = await prisma.storeSetting.findUnique({
    where: { id: "global" }
  })

  if (!settings?.maintenanceMode) {
    redirect("/user")
  }

  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role as string
  
  const isBackofficeUser = ["ADMIN", "MANAGER", "STAFF"].includes(userRole)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Wrench className="w-24 h-24 text-purple-600 mb-6 animate-bounce" />
      
      <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">
        เว็บไซต์กำลังปิดปรับปรุง 🚧
      </h1>
      
      <p className="text-gray-500 text-lg text-center max-w-lg mb-8">
        ขออภัยในความไม่สะดวกครับ ตอนนี้เรากำลังอัปเกรดระบบเพื่อประสบการณ์การช้อปปิ้งที่ดียิ่งขึ้น 
        กรุณากลับมาเยี่ยมชมเราใหม่อีกครั้งในภายหลังนะครับ
      </p>

      {isBackofficeUser && (
        <a 
          href="/admin"
          className="text-sm text-purple-600 hover:text-purple-800 underline decoration-purple-300 underline-offset-4"
        >
          สำหรับผู้ดูแลระบบ (เข้าสู่ระบบหลังบ้าน)
        </a>
      )}
    </div>
  )
}