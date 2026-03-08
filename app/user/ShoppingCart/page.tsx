import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import CartClient from "./CartClient"

export const dynamic = "force-dynamic"

export default async function ShoppingCartPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const [userProfile, cart] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: session.user.id },
      select: { phonenumber: true, address: true },
    }),
    prisma.cart.findUnique({
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
          orderBy: { id: "asc" },
        },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">ตะกร้าสินค้า</h1>
            <p className="text-[16px] text-gray-500 font-medium mt-1">ตรวจสอบสินค้าและยืนยันการสั่งซื้อ</p>
          </div>
        </div>
        <CartClient initialItems={cart?.items || []} userProfile={userProfile} />
      </div>
    </div>
  )
}