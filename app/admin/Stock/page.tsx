import prisma from "@/utils/db"
import StockTable from "@/components/admin/StockTable"

export default async function StockPage() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      images: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const data = products.map((product) => {
    const totalStock = product.variants.reduce(
      (sum, variant) => sum + variant.stock,
      0
    )

    return {
      Pid: product.Pid,
      productCode: product.productCode ?? "-",
      name: product.Pname,
      stock: totalStock,
      imageUrl: product.images[0]?.url ?? null,
    }
  })

  return <StockTable data={data} />
}
