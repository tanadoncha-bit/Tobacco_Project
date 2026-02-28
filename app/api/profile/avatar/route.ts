export const dynamic = "force-dynamic";

import { NextResponse } from "next/server"
import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { v2 as cloudinary } from "cloudinary"

// ตั้งค่า Cloudinary ตรงนี้ (หรือถ้าคุณมีใน utils/cloudinary.ts ก็ import มาใช้ได้เลย)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { image } = await req.json()
    if (!image) {
      return NextResponse.json({ message: "No image provided" }, { status: 400 })
    }

    // 1. อัปโหลดขึ้น Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: "next_shop_avatars", 
      transformation: [{ width: 500, height: 500, crop: "fill" }] // ครอปให้เป็นสี่เหลี่ยมจัตุรัส
    })

    const newImageUrl = uploadResponse.secure_url

    // 2. อัปเดต URL รูปใน Database
    await prisma.profile.update({
      where: { id: session.user.id },
      data: { profileImage: newImageUrl },
    })

    return NextResponse.json({ success: true, imageUrl: newImageUrl })
  } catch (error: any) {
    console.error("UPLOAD ERROR:", error)
    return NextResponse.json({ message: "เกิดข้อผิดพลาดในการอัปโหลด" }, { status: 500 })
  }
}