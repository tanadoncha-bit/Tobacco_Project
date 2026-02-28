export const dynamic = "force-dynamic";

import prisma from "@/utils/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// ดึงรายชื่อพนักงานทั้งหมด (ไม่เอาลูกค้าธรรมดา)
export async function GET() {
  try {
    const employees = await prisma.profile.findMany({
      // สมมติว่าลูกค้าปกติคือ "USER" เราจะดึงเฉพาะคนที่ไม่ใช่ USER
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

// สร้างบัญชีพนักงานใหม่
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firstname, lastname, email, password, role } = body

    if (!email || !password || !firstname || !role) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    // เช็คว่าอีเมลนี้ซ้ำไหม
    const existingUser = await prisma.profile.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 })
    }

    // เข้ารหัสรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10)

    // บันทึกลง Database
    const newEmployee = await prisma.profile.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role, // เช่น "ADMIN", "STAFF", "MANAGER"
      }
    })

    return NextResponse.json({ success: true, message: "สร้างบัญชีพนักงานสำเร็จ!" })
  } catch (error) {
    console.error("CREATE_EMPLOYEE_ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการสร้างบัญชี" }, { status: 500 })
  }
}

// อัปเดตข้อมูลพนักงาน (และเปลี่ยนรหัสผ่านถ้ามี)
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, firstname, lastname, email, password, role } = body

    if (!id || !firstname || !email || !role) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" }, { status: 400 })
    }

    // เตรียมข้อมูลที่จะอัปเดต
    const updateData: any = {
      firstname,
      lastname,
      email,
      role
    }

    // ทริคสำคัญ: ถ้าแอดมินพิมพ์รหัสผ่านใหม่มา ค่อยทำการเข้ารหัสแล้วจับยัดใส่ updateData
    // แต่ถ้าเป็นค่าว่าง (ไม่ได้พิมพ์) เราก็จะไม่ยุ่งกับรหัสผ่านเดิมของเขา
    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // อัปเดตลง Database
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