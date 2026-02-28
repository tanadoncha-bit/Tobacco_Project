export const dynamic = "force-dynamic";

import prisma from "@/utils/db"
import { NextResponse } from "next/server"

export async function DELETE(req: Request) {
  try {
    const { Pid } = await req.json()

    if (!Pid) {
      return NextResponse.json(
        { message: "Pid is required" },
        { status: 400 }
      )
    }

    // 🔍 เช็คก่อนว่ามี product ไหม
    const product = await prisma.product.findUnique({
      where: { Pid },
      select: { Pid: true },
    })

    if (!product) {
      // ✅ ถ้าไม่เจอ ถือว่าลบสำเร็จแล้ว
      return NextResponse.json({ success: true })
    }

    // ✅ ลบจริง
    await prisma.product.delete({
      where: { Pid },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
