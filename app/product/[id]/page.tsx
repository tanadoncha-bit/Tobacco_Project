import prisma from "@/utils/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import ProductInteractive from "./ProductInteractive"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = parseInt(id)

  // 1. ดึงข้อมูลสินค้าแบบจัดเต็ม! (เอารูปภาพและตัวเลือกมาด้วย)
  const product = await prisma.product.findUnique({
    where: { Pid: productId },
    include: { 
      images: true, // ดึงรูปภาพ
      Option: { include: { values: true } }, 
      variants: { 
        include: { 
          values: { include: { optionValue: true } } 
        } 
      } 
    }
  })

  if (!product) {
    redirect("/user")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* ปุ่มย้อนกลับ */}
        <Link href="/user" className="inline-flex items-center text-gray-500 hover:text-[#2E4BB1] mb-6 transition-colors font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" />
          กลับไปหน้าสินค้าทั้งหมด
        </Link>

        <ProductInteractive product={product} />

      </div>
    </div>
  )
}