export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const orderId = formData.get("orderId") as string

    if (!file || !orderId) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 })
    }

    // 1. แปลงไฟล์รูปภาพเป็น Base64 เพื่อส่งให้ Cloudinary
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`

    // 2. อัปโหลดขึ้น Cloudinary (เก็บในโฟลเดอร์ชื่อ payment_slips)
    const uploadResponse = await cloudinary.uploader.upload(base64Image, {
      folder: "payment_slips", 
    })

    // 3. เอา URL ที่ได้จาก Cloudinary มาบันทึกลง Database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        slipImage: uploadResponse.secure_url,
        status: "VERIFYING", // 👈 อัปเดตสถานะเป็น "กำลังตรวจสอบ" ให้แอดมินรู้
      },
    })

    return NextResponse.json({ success: true, url: uploadResponse.secure_url })
  } catch (error) {
    console.error("UPLOAD SLIP ERROR:", error)
    return NextResponse.json({ error: "ไม่สามารถอัปโหลดสลิปได้" }, { status: 500 })
  }
}