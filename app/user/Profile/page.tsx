import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ChevronLeft } from "lucide-react"

import FormContainer from "@/components/form/FormContainer"
import FormInput from "@/components/form/FormInput"
import AvatarUploader from "@/components/form/AvatarUploader"
import { updateProfileAction } from "@/utils/actions"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id }
  })

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">ไม่พบข้อมูลโปรไฟล์ กรุณาลองใหม่อีกครั้ง</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 relative">

      <div className="mb-6">
        <Link href="/user" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-6 group">
          <div className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 group-hover:border-purple-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          กลับไปหน้าสินค้าทั้งหมด
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">จัดการบัญชีผู้ใช้</h1>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">

        <div className="mb-10 flex flex-col items-center border-b pb-8">
          <AvatarUploader />
        </div>

        <div className="mb-8 border-b border-gray-100 pb-6">
          <h3 className="text-2xl font-bold text-gray-800">ข้อมูลส่วนตัวและที่อยู่จัดส่ง</h3>
          <p className="text-gray-500 mt-2 text-sm">
            อัปเดตข้อมูลส่วนตัวและช่องทางการติดต่อเพื่อให้ระบบแสดงผลได้อย่างถูกต้อง
          </p>
        </div>

        <FormContainer action={updateProfileAction} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              name="firstname"
              type="text"
              label="ชื่อจริง *"
              defaultValue={profile.firstname}
            />
            <FormInput
              name="lastname"
              type="text"
              label="นามสกุล *"
              defaultValue={profile.lastname}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <FormInput
              name="phonenumber"
              type="text"
              label="เบอร์โทรศัพท์ *"
              defaultValue={profile.phonenumber || ""}
              placeholder="เช่น 0812345678"
            />

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium leading-none">
                ที่อยู่สำหรับจัดส่งพัสดุ *
              </label>
              <textarea
                name="address"
                id="address"
                rows={4}
                defaultValue={profile.address || ""}
                placeholder="บ้านเลขที่, หมู่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
                required
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] text-white px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 focus:ring-4 focus:ring-purple-200 shadow-lg shadow-purple-500/30 flex items-center gap-2 cursor-pointer"
            >
              บันทึกการเปลี่ยนแปลง
            </button>
          </div>
        </FormContainer>

      </div>
    </div>
  )
}