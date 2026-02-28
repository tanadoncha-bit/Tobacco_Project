import prisma from "@/utils/db"
import Link from "next/link"
import { ShoppingCart, Search } from "lucide-react"
import BannerSlider from "@/components/BannerSlider"
import ProductButton from "@/components/ProductButton"

export const revalidate = 15;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const keyword = params.search || ""

  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const products = await prisma.product.findMany({
    where: {
      ...(keyword ? {
        Pname: {
          contains: keyword,
          mode: "insensitive",
        }
      } : {})
    },
    include: {
      variants: true,
      images: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen bg-gray-50">

      <BannerSlider banners={banners} />

      <div className="container mx-auto px-4 py-12">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {keyword ? "ผลการค้นหา" : "สินค้าทั้งหมด"}
            </h2>
            {keyword && (
              <p className="text-gray-500 mt-1">
                กำลังค้นหาคำว่า: <span className="font-semibold text-[#2E4BB1]">"{keyword}"</span>
              </p>
            )}
          </div>
          <span className="bg-white px-4 py-2 rounded-full shadow-sm text-sm text-gray-600 font-medium border border-gray-100">
            พบ {products.length} รายการ
          </span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <Search className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {keyword ? `ไม่พบสินค้าที่ตรงกับ "${keyword}"` : "ยังไม่มีสินค้าในขณะนี้"}
            </p>
            {keyword && (
              <Link href="/user">
                <button className="mt-6 px-6 py-2.5 bg-[#2E4BB1] hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                  กลับไปดูสินค้าทั้งหมด
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
              const isOutOfStock = totalStock <= 0
              const prices = product.variants.map(v => v.price || 0)
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0

              const imageUrl = product.images[0]?.url ?? null

              return (
                <div key={product.Pid} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col group cursor-pointer">

                  <div className="aspect-square bg-gray-50 relative flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.Pname}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm font-medium">ไม่มีรูปภาพ</span>
                    )}

                    {isOutOfStock && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                        หมดชั่วคราว
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2" title={product.Pname}>
                      {product.Pname}
                    </h3>
                    <p className="text-purple-700 font-bold text-lg mb-4">
                      {minPrice > 0 ? `฿${minPrice.toLocaleString()}` : "N/A"}
                    </p>

                    <div className="mt-auto">
                      {isOutOfStock ? (
                        <button disabled className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed text-sm">
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
      </div>
    </div>
  )
}