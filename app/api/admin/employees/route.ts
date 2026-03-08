import prisma from "@/utils/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const employees = await prisma.profile.findMany({
      where: {
        role: { not: "USER" } 
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        role: true,
        profileImage: true,
      }
    })
    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json({ message: "ดึงข้อมูลล้มเหลว" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstname, lastname, email, password, role } = body

    if (!email || !password || !firstname || !role) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const existingUser = await prisma.profile.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newEmployee = await prisma.profile.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
      }
    })

    return NextResponse.json({ success: true, message: "สร้างบัญชีพนักงานสำเร็จ!" })
  } catch (error) {
    console.error("CREATE_EMPLOYEE_ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสร้างบัญชี" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, firstname, lastname, email, password, role } = body

    if (!id || !firstname || !email || !role) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" }, { status: 400 })
    }

    const updateData: any = {
      firstname,
      lastname,
      email,
      role
    }

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    await prisma.profile.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({ success: true, message: "อัปเดตข้อมูลพนักงานสำเร็จ!" })
  } catch (error) {
    console.error("UPDATE_EMPLOYEE_ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" }, { status: 500 })
  }
}