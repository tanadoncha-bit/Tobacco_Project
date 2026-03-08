import { NextResponse } from "next/server"
import prisma from "@/utils/db"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const pendingOrders = await prisma.productionOrder.findMany({
      where: { status: "PENDING" },
      include: {
        variant: {
          include: {
            product: true,
            values: { include: { optionValue: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    const formattedData = pendingOrders.map(order => {
      const options = order.variant.values.map(v => v.optionValue.value).join(", ")
      const productName = options 
        ? `${order.variant.product.Pname} (${options})`
        : order.variant.product.Pname

      return {
        id: order.id,
        docNo: order.docNo,
        amount: order.amount,
        productName: productName,
        variantId: order.variantId
      }
    })

    return NextResponse.json(formattedData)
  } catch (error: any) {
    console.error("Fetch Pending Error:", error)
    return NextResponse.json({ error: "ดึงข้อมูลบิลผลิตค้างรับไม่สำเร็จ" }, { status: 500 })
  }
}