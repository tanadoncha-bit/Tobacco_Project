import prisma from "@/utils/db"
import MaterialTable from "@/components/admin/MaterialTable"

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  })

  return <MaterialTable initialMaterials={materials} />
}