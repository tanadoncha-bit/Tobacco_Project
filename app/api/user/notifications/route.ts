import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json([])

  const orders = await prisma.order.findMany({
    where: {
      profileId: session.user.id,
      status: { in: ["VERIFYING", "PAID", "SHIPPED", "COMPLETED"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { id: true, status: true, totalAmount: true, updatedAt: true },
  })

  return NextResponse.json(orders)
}