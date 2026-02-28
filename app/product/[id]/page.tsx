import prisma from "@/utils/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft } from "lucide-react"
import ProductInteractive from "./ProductInteractive"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = parseInt(id)

  const product = await prisma.product.findUnique({
    where: { Pid: productId },
    include: {
      images: true,
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

        <Link href="/user" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-6 group">
          <div className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 group-hover:border-purple-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          กลับไปหน้าสินค้าทั้งหมด
        </Link>

        <ProductInteractive product={product} />

      </div>
    </div>
  )
}