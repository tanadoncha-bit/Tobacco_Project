import prisma from "@/utils/db"
import HistoryClient from "./HistoryClient"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export const dynamic = "force-dynamic";

export default async function GlobalHistoryPage() {

  const session = await getServerSession(authOptions)
  const rawMaterialTx = await prisma.materialTransaction.findMany({
    include: { material: true, profile: true },
    orderBy: { createdAt: 'desc' },
  })

  const rawStockTx = await prisma.stockTransaction.findMany({
    include: {
      profile: true,
      variant: {
        include: {
          product: true,
          values: { include: { optionValue: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  const formattedMaterialTx = rawMaterialTx.map((tx) => ({
    id: `MAT-${tx.id}`,
    date: tx.createdAt,
    type: tx.type,
    category: "MATERIAL",
    itemName: tx.material.name,
    amount: tx.amount,
    unit: tx.material.unit,
    totalCost: tx.totalCost,
    note: tx.note,
    creatorName: tx.profile ? `${tx.profile.firstname} ${tx.profile.lastname}` : "System",
    creatorImage: tx.profile?.profileImage || null
  }))

  const formattedStockTx = rawStockTx.map((tx) => {
    const variantName = tx.variant.values?.map((v: any) => v.optionValue.value).join(" / ")
    const fullName = variantName
      ? `${tx.variant.product.Pname} (${variantName})`
      : tx.variant.product.Pname

    return {
      id: `PRD-${tx.id}`,
      date: tx.createdAt,
      type: tx.type,
      category: "PRODUCT",
      itemName: fullName,
      amount: tx.amount,
      unit: "ชิ้น",
      totalCost: null,
      note: tx.note,
      creatorName: tx.profile ? `${tx.profile.firstname} ${tx.profile.lastname}` : "System",
      creatorImage: tx.profile?.profileImage || null
    }
  })

  const allTransactions = [...formattedMaterialTx, ...formattedStockTx].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return <HistoryClient initialData={allTransactions} />
}