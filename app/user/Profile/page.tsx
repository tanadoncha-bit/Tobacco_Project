import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserCircle } from "lucide-react"
import FormContainer from "@/components/form/FormContainer"
import FormInput from "@/components/form/FormInput"
import AvatarUploader from "@/components/form/AvatarUploader"
import { updateProfileAction } from "@/utils/actions"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } })
  if (!profile) return (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-gray-500 font-medium">ไม่พบข้อมูลโปรไฟล์</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        <Link href="/user" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors group">
          <div className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 group-hover:border-purple-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          กลับไปหน้าสินค้าทั้งหมด
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Banner */}
          <div className="h-24 bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)]" />

          {/* Avatar + name */}
          <div className="px-6 pb-6 flex flex-col items-center text-center -mt-12">
            <AvatarUploader />
            <h2 className="text-xl font-black text-gray-900 mt-2">{profile.firstname} {profile.lastname}</h2>
            <p className="text-sm text-gray-400 font-medium mt-0.5">{session.user?.email}</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/30">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-sm shadow-purple-200">
              <UserCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900">ข้อมูลส่วนตัวและที่อยู่จัดส่ง</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">อัปเดตข้อมูลเพื่อให้ระบบแสดงผลได้อย่างถูกต้อง</p>
            </div>
          </div>

          <FormContainer action={updateProfileAction} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormInput name="firstname" type="text" label="ชื่อจริง *"   defaultValue={profile.firstname} />
              <FormInput name="lastname"  type="text" label="นามสกุล *"   defaultValue={profile.lastname} />
            </div>
            <FormInput name="phonenumber" type="text" label="เบอร์โทรศัพท์ *"
              defaultValue={profile.phonenumber || ""} placeholder="เช่น 0812345678" />
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                ที่อยู่สำหรับจัดส่งพัสดุ *
              </label>
              <textarea name="address" rows={4}
                defaultValue={profile.address || ""}
                placeholder="บ้านเลขที่, หมู่, ซอย, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all resize-none"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit"
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer">
                บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </FormContainer>
        </div>

      </div>
    </div>
  )
}