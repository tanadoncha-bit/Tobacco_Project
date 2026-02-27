"use server"

import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { revalidatePath } from "next/cache"

export const updateProfileAction = async (prevState: any, formData: FormData) => {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return { message: "กรุณาเข้าสู่ระบบก่อน" }
        }

        // ดึงข้อมูลจากฟอร์ม
        const firstname = formData.get("firstname") as string
        const lastname = formData.get("lastname") as string
        const phonenumber = formData.get("phonenumber") as string
        const address = formData.get("address") as string

        // อัปเดตข้อมูลลงฐานข้อมูล
        await prisma.profile.update({
            where: { id: session.user.id },
            data: {
                firstname,
                lastname,
                phonenumber,
                address,
            }
        })

        revalidatePath("/user/Profile")
        
        return { message: "อัปเดตข้อมูลโปรไฟล์สำเร็จ" }
    } catch (error: any) {
        console.error("UPDATE PROFILE ERROR:", error)
        return { message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล" }
    }
}