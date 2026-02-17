import { NextResponse } from "next/server"
import prisma from "@/utils/db"

export async function DELETE(req: Request) {
  const { Pid } = await req.json()

  await prisma.product.delete({
    where: { Pid },
  })

  return NextResponse.json({ success: true })
}
