import prisma from "@/utils/db"
import MaterialTable from "@/components/admin/materials/MaterialTable"

export const dynamic = "force-dynamic"

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
    include: {
      MaterialLot: {
        where: { stock: { gt: 0 } },
        orderBy: [{ expireDate: "asc" }, { receiveDate: "asc" }],
      },
    },
  })

  const totalMaterials = materials.length
  const outOfStock     = materials.filter(m => m.stock === 0).length
  const lowStock       = materials.filter(m => m.stock > 0 && m.stock <= 10).length

  const today = new Date()
  const in30  = new Date(today)
  in30.setDate(today.getDate() + 30)
  const nearExpiry = materials.filter(m =>
    m.MaterialLot?.some(lot => lot.expireDate && new Date(lot.expireDate) <= in30)
  ).length

  return (
    <MaterialTable
      initialMaterials={materials}
      stats={{ totalMaterials, outOfStock, lowStock, nearExpiry }}
    />
  )
}