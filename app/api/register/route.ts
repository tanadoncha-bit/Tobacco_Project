export const dynamic = "force-dynamic";

import prisma from "@/utils/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password, firstname, lastname } = await req.json()

    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    // เช็คว่าอีเมลนี้มีในระบบหรือยัง
    const existingUser = await prisma.profile.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 })
    }

    // เข้ารหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10)

    // บันทึกลง Database
    const newUser = await prisma.profile.create({
      data: {
        email,
        password: hashedPassword,
        firstname,
        lastname,
      },
    })

    return NextResponse.json({ success: true, user: { email: newUser.email } }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "เกิดข้อผิดพลาด" }, { status: 500 })
  }
}