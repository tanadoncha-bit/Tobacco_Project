import prisma from "@/utils/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password, firstname, lastname } = await req.json()

    if (!email || !password || !firstname || !lastname) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 })
    }

    const existingUser = await prisma.profile.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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