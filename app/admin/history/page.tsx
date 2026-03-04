import prisma from "@/utils/db"
import HistoryClient from "./HistoryClient"

export const dynamic = "force-dynamic"

type Transaction = {
  id: string
  date: Date
  type: string
  reason: string | null
  category: string
  itemName: string
  amount: number
  unit: string
  totalCost: number | null
  note: string | null
  creatorName: string
  creatorImage: string | null
  lotNumber: string | null
  productionDocNo: string | null
}

export default async function HistoryPage() {
  const materialTx = await prisma.materialTransaction.findMany({
    include: {
      material: true,
      profile: true,
      materialLot: true,
      productionOrder: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const stockTx = await prisma.stockTransaction.findMany({
    include: {
      variant: {
        include: { product: true, values: { include: { optionValue: true } } }
      },
      profile: true,
      variantLot: true,
      productionOrder: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const formattedMaterialTx: Transaction[] = materialTx.map((tx) => ({
    id: `mat-${tx.id}`,
    date: tx.createdAt,
    type: tx.type,
    reason: tx.reason || null,
    category: "MATERIAL",
    itemName: tx.material.name,
    amount: tx.amount,
    unit: tx.material.unit,
    totalCost: tx.totalCost,
    note: tx.note,
    creatorName: tx.profile ? `${tx.profile.firstname} ${tx.profile.lastname}` : "ไม่ระบุ",
    creatorImage: tx.profile?.profileImage || null,
    lotNumber: tx.materialLot?.lotNumber || null,
    productionDocNo: tx.productionOrder?.docNo || null,
  }))

  const formattedStockTx: Transaction[] = stockTx.map((tx) => {
    const variantNames = tx.variant.values?.map((v: any) => v.optionValue.value).join(" ")
    const fullName = variantNames ? `${tx.variant.product.Pname} (${variantNames})` : tx.variant.product.Pname

    return {
      id: `stk-${tx.id}`,
      date: tx.createdAt,
      type: tx.type,
      reason: tx.reason || null,
      category: "PRODUCT",
      itemName: fullName,
      amount: tx.amount,
      unit: "ชิ้น",
      totalCost: null,
      note: tx.note,
      creatorName: tx.profile ? `${tx.profile.firstname} ${tx.profile.lastname}` : "ไม่ระบุ",
      creatorImage: tx.profile?.profileImage || null,
      lotNumber: tx.variantLot?.lotNumber || null,
      productionDocNo: tx.productionOrder?.docNo || null,
    }
  })

  const allTransactions = [...formattedMaterialTx, ...formattedStockTx].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )

  return <HistoryClient initialData={allTransactions} />
}