import prisma from "@/utils/db"
import ProductionClient from "./ProductionClient"

export const dynamic = "force-dynamic"

export default async function ProductionPage() {
  const orders = await prisma.productionOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variant: {
        include: {
          product: true,
          values: { include: { optionValue: true } }
        }
      },
      materialTransactions: {
        include: { material: true }
      },
      stockTransactions: {
        include: { variantLot: true }
      }
    }
  })

  const formatted = orders.map(order => {
    const variantName = order.variant.values?.map(v => v.optionValue.value).join(", ")
    const fullName = variantName
      ? `${order.variant.product.Pname} (${variantName})`
      : order.variant.product.Pname

    const totalCost = order.materialTransactions.reduce((sum, tx) => {
      return sum + (tx.totalCost || 0)
    }, 0)

    const lots = order.stockTransactions
      .filter(tx => tx.type === "PROD_IN")
      .map(tx => tx.variantLot?.lotNumber || "-")

    return {
      id: order.id,
      docNo: order.docNo,
      productName: fullName,
      amount: order.amount,
      status: order.status,
      note: order.note,
      totalCost,
      lots,
      createdAt: order.createdAt,
      materials: order.materialTransactions.map(tx => ({
        name: tx.material.name,
        unit: tx.material.unit,
        amount: tx.amount,
        totalCost: tx.totalCost || 0
      }))
    }
  })

  return <ProductionClient orders={formatted} />
}