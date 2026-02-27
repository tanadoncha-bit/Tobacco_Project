import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export async function GET() {
  try {
    let settings = await prisma.storeSetting.findUnique({
      where: { id: "global" }
    })

    // ถ้ายังไม่มีข้อมูลในระบบ ให้สร้างค่าเริ่มต้น
    if (!settings) {
      settings = await prisma.storeSetting.create({
        data: { id: "global" }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: "ดึงข้อมูลล้มเหลว" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // ป้องกันคนที่ไม่ใช่ ADMIN เข้าถึง (ถ้าคุณมีเช็ค Role)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 })
    }

    const body = await req.json()
    const { 
      storeName, email, phone, address, maintenanceMode, 
      bankName, accountNumber, accountName 
    } = body

    const updatedSettings = await prisma.storeSetting.upsert({
      where: { id: "global" },
      update: { 
        storeName, email, phone, address, maintenanceMode,
        bankName, accountNumber, accountName 
      },
      create: { 
        id: "global", 
        storeName, email, phone, address, maintenanceMode,
        bankName, accountNumber, accountName 
      },
    })

    return NextResponse.json(updatedSettings)
  } catch (error) {
    return NextResponse.json({ error: "อัปเดตข้อมูลล้มเหลว" }, { status: 500 })
  }
}