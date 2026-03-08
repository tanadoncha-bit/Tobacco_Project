import prisma from "@/utils/db"
import MaterialTable from "@/components/admin/materials/MaterialTable"

export const dynamic = "force-dynamic"

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
    include: {
      MaterialLot: {
        orderBy: [{ expireDate: "asc" }, { receiveDate: "asc" }],
      },
    },
  })

  const today = new Date()
  const in30  = new Date(today)
  in30.setDate(today.getDate() + 30)

  // คำนวณ stock รวมจาก lot
  const materialsWithStock = materials.map(m => ({
    ...m,
    totalStock: m.MaterialLot.reduce((sum, lot) => sum + lot.stock, 0),
  }))

  const totalMaterials = materials.length
  const outOfStock     = materialsWithStock.filter(m => m.totalStock === 0).length
  const lowStock       = materialsWithStock.filter(m => m.totalStock > 0 && m.totalStock <= 10).length
  const nearExpiry     = materials.filter(m =>
    m.MaterialLot.some(lot => lot.expireDate && new Date(lot.expireDate) <= in30)
  ).length

  return (
    <MaterialTable
      initialMaterials={materialsWithStock}
      stats={{ totalMaterials, outOfStock, lowStock, nearExpiry }}
    />
  )
}