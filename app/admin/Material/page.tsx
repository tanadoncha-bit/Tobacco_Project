import prisma from "@/utils/db"
import MaterialTable from "@/components/admin/materials/MaterialTable"

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: { name: "asc" },
    include: {
      // ดึงข้อมูล Lot ที่สต๊อกยังมากกว่า 0 มาด้วย
      MaterialLot: {
        where: { stock: { gt: 0 } },
        orderBy: [
          // เรียงตามวันหมดอายุก่อน (เอาอันใกล้หมดอายุขึ้นก่อน)
          { expireDate: 'asc' },
          // ถ้าไม่มีวันหมดอายุ ให้เรียงตามวันที่รับเข้า
          { receiveDate: 'asc' }
        ]
      }
    }
  })

  return <MaterialTable initialMaterials={materials} />
}