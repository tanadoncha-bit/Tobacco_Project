import prisma from "@/utils/db"
import StockTable from "@/components/admin/stock/StockTable"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export const dynamic = "force-dynamic"

export default async function StockPage() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role || "STAFF"

  const products = await prisma.product.findMany({
    include: {
      variants: {
        include: {
          productVariantLots: true,
        }
      },
      images: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const data = products.map((product) => {
    const totalStock = product.variants.reduce((sum, v) => {
      const variantStock = v.productVariantLots
        .filter(lot => !lot.expireDate || lot.expireDate > new Date())
        .reduce((s, lot) => s + lot.stock, 0)
      return sum + variantStock
    }, 0)
    return {
      Pid: product.Pid,
      productCode: product.productCode ?? "-",
      name: product.Pname,
      stock: totalStock,
      imageUrl: product.images[0]?.url ?? null,
    }
  })

  const totalProducts = data.length
  const outOfStock = data.filter(p => p.stock === 0).length
  const lowStock = data.filter(p => p.stock > 0 && p.stock <= 5).length
  const totalStock = data.reduce((sum, p) => sum + p.stock, 0)

  return (
    <StockTable
      data={data}
      userRole={userRole}
      stats={{ totalProducts, outOfStock, lowStock, totalStock }}
    />
  )
}