import { NextResponse } from "next/server"
import prisma from "@/utils/db"

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { orderId, trackingNumber } = body

    if (!orderId) {
      return new NextResponse("Missing orderId", { status: 400 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        trackingNumber: trackingNumber || null 
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("[UPDATE_TRACKING_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}