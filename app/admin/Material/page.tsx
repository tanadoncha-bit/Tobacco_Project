import prisma from "@/utils/db"
import MaterialTable from "@/components/admin/MaterialTable"

export default async function MaterialsPage() {
  // ดึงข้อมูลวัตถุดิบทั้งหมด เรียงตามอักษร
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
  })

  // ตัว component MaterialTable จัดการเรื่อง padding/container ในตัวมันเองแล้ว
  return <MaterialTable initialMaterials={materials} />
}