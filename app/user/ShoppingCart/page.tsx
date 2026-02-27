import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import CartClient from "./CartClient" 

export const dynamic = "force-dynamic"

export default async function ShoppingCartPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // 🚀 1. ดึงข้อมูลโปรไฟล์ของ User เพื่อเช็คว่ามีเบอร์โทร/ที่อยู่ไหม
  // (ถ้า Model ของคุณชื่อ User ให้เปลี่ยน prisma.profile เป็น prisma.user นะครับ)
  const userProfile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { 
      phonenumber: true, 
      address: true 
    }
  })

  // 2. ดึงข้อมูลตะกร้าของ User (เหมือนเดิม)
  const cart = await prisma.cart.findUnique({
    where: { profileId: session.user.id },
    include: {
      items: {
        include: {
          variant: {
            include: { 
              product: {
                include: {
                  images: true
                }
              }
            }
          }
        },
        orderBy: { id: 'asc' }
      }
    }
  })

  const initialItems = cart?.items || []

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="w-8 h-8 text-[#2E4BB1]" />
          <h1 className="text-3xl font-bold text-gray-800">ตะกร้าสินค้าของคุณ</h1>
        </div>

        {/* 🚀 3. ส่ง userProfile ลงไปให้ CartClient ด้วย */}
        <CartClient 
          initialItems={initialItems} 
          userProfile={userProfile} 
        />

      </div>
    </div>
  )
}