"use server"

import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { revalidatePath } from "next/cache"

export async function getAdminBanners() {
  try {
    return await prisma.banner.findMany({ orderBy: { createdAt: "desc" } })
  } catch (error) {
    return []
  }
}

export async function addBannerAction(imageUrl: string) {
  try {
    await prisma.banner.create({ data: { imageUrl } })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, message: "เพิ่มรูปไม่สำเร็จ" }
  }
}

export async function toggleBannerAction(id: string, isActive: boolean) {
  try {
    await prisma.banner.update({ where: { id }, data: { isActive } })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function deleteBannerAction(id: string) {
  try {
    await prisma.banner.delete({ where: { id } })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function updateProfileAction(prevState: any, formData: FormData) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, message: "กรุณาเข้าสู่ระบบ" }
    }

    const firstname = formData.get("firstname") as string
    const lastname = formData.get("lastname") as string
    const phonenumber = formData.get("phonenumber") as string
    const address = formData.get("address") as string

    const isAdmin = session.user.role === "ADMIN"

    const targetUrl = isAdmin ? "/admin" : "/user"

    await prisma.profile.update({
      where: { id: session.user.id },
      data: {
        firstname,
        lastname,
        phonenumber,
        address,
      },
    })
    


    return { message: "บันทึกข้อมูลเรียบร้อย!", redirectUrl: targetUrl}

  } catch (error) {
    console.error(error)
    return { message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }
  }
}