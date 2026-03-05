import prisma from "@/utils/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ProductInteractive from "./ProductInteractive"
import ProductButton from "@/components/ProductButton"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = parseInt(id)

  const [product, relatedProducts] = await Promise.all([
    prisma.product.findUnique({
      where: { Pid: productId },
      include: {
        images: true,
        Option: { include: { values: true } },
        variants: {
          include: {
            values: { include: { optionValue: true } },
            productVariantLots: true,
          }
        },
      },
    }),
    prisma.product.findMany({
      where: { Pid: { not: productId } },
      include: {
        variants: {
          include: {
            productVariantLots: true,
          }
        },
        images: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ])

  if (!product) redirect("/user")

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-10">

        <Link href="/user" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors group">
          <div className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 group-hover:border-purple-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          กลับไปหน้าสินค้าทั้งหมด
        </Link>

        <ProductInteractive product={product} />

        {relatedProducts.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full" />
              <h2 className="text-xl font-black text-gray-900">สินค้าอื่นที่น่าสนใจ</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => {
                const minPrice = Math.min(...p.variants.map(v => v.price ?? 0))
                const imageUrl = p.images[0]?.url ?? null
                const outOfStock = p.variants.reduce((s, v) => {
                  return s + v.productVariantLots
                    .filter(lot => !lot.expireDate || new Date(lot.expireDate) > new Date())
                    .reduce((ls, lot) => ls + lot.stock, 0)
                }, 0) <= 0
                return (
                  <div key={p.Pid} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group flex flex-col">
                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                      {imageUrl
                        ? <img src={imageUrl} alt={p.Pname} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">ไม่มีรูป</div>
                      }
                      {outOfStock && (
                        <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">หมด</div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-grow">
                      <p className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{p.Pname}</p>
                      <p className="text-purple-700 font-black mb-2">฿{minPrice.toLocaleString()}</p>
                      <div className="mt-auto">
                        <ProductButton productId={p.Pid} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}