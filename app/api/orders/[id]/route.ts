export const dynamic = "force-dynamic";

import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const orderId = params.id;
    const { status, trackingNo } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: "Invalid Order ID" }, { status: 400 });
    }

    // อัปเดตข้อมูลออเดอร์
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status, 
        trackingNumber: trackingNo || null 
      },
    });

    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error: any) {
    console.error("UPDATE ORDER ERROR:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}