import prisma from "@/utils/db"
import Link from "next/link"
import { Search, TrendingUp, Shield, Truck, HeadphonesIcon } from "lucide-react"
import BannerSlider from "@/components/BannerSlider"
import ProductButton from "@/components/ProductButton"

export const revalidate = 15

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const keyword = params.search || ""

  const [banners, products, topVariants] = await Promise.all([
    prisma.banner.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.product.findMany({
      where: keyword ? { Pname: { contains: keyword, mode: "insensitive" } } : {},
      include: {
        variants: {
          include: {
            productVariantLots: true,
          }
        },
        images: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    !keyword ? prisma.orderItem.groupBy({
      by: ["variantId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 4,
      where: {
        order: {
          status: { not: "CANCELLED" }
        }
      }
    }) : Promise.resolve([]),
  ])

  const topProductIds = topVariants.map((t: any) => t.variantId)
  const topProducts = topProductIds.length > 0
    ? await prisma.productVariant.findMany({
      where: { id: { in: topProductIds } },
      include: {
        product: { include: { images: true } },
        productVariantLots: true,
      },
    })
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      <BannerSlider banners={banners} />

      {/* Trust badges */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 grid grid-cols-2 md:flex md:justify-between gap-4">
          {[
            { icon: <Truck className="w-5 h-5 text-purple-600" />, label: "จัดส่งฟรี", sub: "ทุกออเดอร์" },
            { icon: <Shield className="w-5 h-5 text-purple-600" />, label: "สินค้าแท้ 100%", sub: "รับประกันคุณภาพ" },
            { icon: <HeadphonesIcon className="w-5 h-5 text-purple-600" />, label: "ซัพพอร์ต 24/7", sub: "พร้อมช่วยเหลือ" },
            { icon: <TrendingUp className="w-5 h-5 text-purple-600" />, label: "สินค้าคุณภาพสูง", sub: "คัดสรรมาเพื่อคุณ" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 space-y-12">

        {!keyword && topProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full" />
                <h2 className="text-xl font-black text-gray-900">สินค้าขายดี</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topVariants.map((t: any, i: number) => {
                const v = topProducts.find((p: any) => p.id === t.variantId)
                if (!v) return null
                const imageUrl = v.product.images?.[0]?.url ?? null

                const stock = (v.productVariantLots ?? [])
                  .filter((lot: any) => !lot.expireDate || new Date(lot.expireDate) > new Date())
                  .reduce((s: number, lot: any) => s + lot.stock, 0)
                const isOutOfStock = stock <= 0

                return (
                  <div key={v.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative flex flex-col">
                    {i < 3 && (
                      <div className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full text-white text-sm font-black flex items-center justify-center shadow-md ${i === 0 ? "bg-amber-400" : i === 1 ? "bg-gray-400" : "bg-orange-400"
                        }`}>
                        {i + 1}
                      </div>
                    )}
                    <div className="aspect-square bg-gray-50 overflow-hidden">
                      {imageUrl
                        ? <img src={imageUrl} alt={v.product.Pname} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">ไม่มีรูป</div>
                      }
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                          หมดชั่วคราว
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-grow">
                      <p className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">{v.product.Pname}</p>
                      <p className="text-purple-600 font-black text-base mb-3">฿{(v.price ?? 0).toLocaleString()}</p>
                      <div className="mt-auto">
                        {isOutOfStock ? (
                          <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed">
                            สินค้าหมด
                          </button>
                        ) : (
                          <ProductButton productId={v.product.Pid} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full" />
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  {keyword ? "ผลการค้นหา" : "สินค้าทั้งหมด"}
                </h2>
                {keyword && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    คำค้น: <span className="font-bold text-purple-600">"{keyword}"</span>
                  </p>
                )}
              </div>
            </div>
            <span className="bg-white px-4 py-2 rounded-2xl shadow-sm text-sm text-gray-600 font-bold border border-gray-100">
              {products.length} รายการ
            </span>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 flex flex-col items-center">
              <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50 mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-900 font-bold text-lg">
                {keyword ? `ไม่พบสินค้า "${keyword}"` : "ยังไม่มีสินค้า"}
              </p>
              {keyword && (
                <Link href="/user">
                  <button className="mt-6 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-all">
                    ดูสินค้าทั้งหมด
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map(product => {
                const totalStock = product.variants.reduce((sum, v) => {
                  const variantStock = v.productVariantLots
                    .filter(lot => !lot.expireDate || new Date(lot.expireDate) > new Date())
                    .reduce((s, lot) => s + lot.stock, 0)
                  return sum + variantStock
                }, 0)
                const isOutOfStock = totalStock <= 0
                const minPrice = Math.min(...product.variants.map(v => v.price || 0))
                const imageUrl = product.images[0]?.url ?? null

                return (
                  <div key={product.Pid} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col group">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {imageUrl
                        ? <img src={imageUrl} alt={product.Pname} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm font-medium">ไม่มีรูปภาพ</div>
                      }
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                          หมดชั่วคราว
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-bold text-gray-800 line-clamp-2 text-sm mb-1">{product.Pname}</h3>
                      <p className="text-purple-700 font-black text-lg mb-3">
                        {minPrice > 0 ? `฿${minPrice.toLocaleString()}` : "N/A"}
                      </p>
                      <div className="mt-auto">
                        {isOutOfStock ? (
                          <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm cursor-not-allowed">
                            สินค้าหมด
                          </button>
                        ) : (
                          <ProductButton productId={product.Pid} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}