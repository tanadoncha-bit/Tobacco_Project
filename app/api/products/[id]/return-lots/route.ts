import prisma from "@/utils/db"
import { NextRequest, NextResponse } from "next/server"
import { TransactionType, TransactionReason } from "@prisma/client"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = parseInt(id)

  const outTxs = await prisma.stockTransaction.findMany({
    where: {
      type: TransactionType.OUT,
      reason: TransactionReason.OFFLINE_SALE,  // เฉพาะเบิกหน้าร้าน
      variantLotId: { not: null },
      variant: { Pid: productId }
    },
    include: {
      variantLot: true,
      variant: { include: { values: { include: { optionValue: true } } } }
    },
    distinct: ["variantLotId"],
    orderBy: { createdAt: "desc" }
  })

  const result = outTxs
    .filter(tx => tx.variantLot)
    .map(tx => ({
      id: tx.variantLot!.id,
      lotNumber: tx.variantLot!.lotNumber || `LOT-${tx.variantLot!.id}`,
      expireDate: tx.variantLot!.expireDate,
      variantId: tx.variantId,
      variantLabel: tx.variant.values?.map(v => v.optionValue.value).join(" / ") || "ค่าเริ่มต้น"
    }))

  return NextResponse.json(result)
}