import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Mail, Save, UserCircle } from "lucide-react"
import FormContainer from "@/components/form/FormContainer"
import FormInput from "@/components/form/FormInput"
import AvatarUploader from "@/components/form/AvatarUploader"
import { updateProfileAction } from "@/utils/actions"

export const revalidate = 60

const ROLE_STYLE: Record<string, string> = {
  ADMIN:   "bg-rose-50 text-rose-600 border-rose-200",
  MANAGER: "bg-blue-50 text-blue-600 border-blue-200",
  STAFF:   "bg-emerald-50 text-emerald-700 border-emerald-200",
}

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const profile = await prisma.profile.findUnique({ where: { id: session.user.id } })

  if (!profile) return (
    <div className="flex flex-col justify-center items-center h-[80vh]">
      <p className="text-gray-500 mb-4 text-lg">ไม่พบข้อมูลโปรไฟล์</p>
      <Link href="/admin" className="text-purple-600 font-bold hover:underline">กลับหน้า Dashboard</Link>
    </div>
  )

  const role = session.user?.role ?? "STAFF"

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <UserCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
          <p className="text-[16px] text-gray-500 font-medium mt-1">จัดการข้อมูลส่วนตัวและช่องทางการติดต่อ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left — Profile card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-28 w-full bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)]" />
            <div className="px-6 pb-8 flex flex-col items-center text-center -mt-14 relative z-10">
              <AvatarUploader />
              <h2 className="text-xl font-black text-gray-900 mt-2">
                {profile.firstname} {profile.lastname}
              </h2>
              <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1 font-medium">
                <Mail className="w-3.5 h-3.5" />
                {session.user?.email}
              </div>
              <div className={`mt-4 px-3 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase flex items-center gap-2 border ${ROLE_STYLE[role] ?? "bg-purple-50 text-purple-700 border-purple-200"}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {role}
              </div>
            </div>
          </div>
        </div>

        {/* Right — Edit form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/30">
              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-sm shadow-purple-200">
                <UserCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">จัดการข้อมูลส่วนตัว</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">อัปเดตข้อมูลเพื่อให้ระบบแสดงผลได้อย่างถูกต้อง</p>
              </div>
            </div>

            <FormContainer action={updateProfileAction} className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput name="firstname" type="text" label="ชื่อจริง"   defaultValue={profile.firstname} />
                <FormInput name="lastname"  type="text" label="นามสกุล"   defaultValue={profile.lastname} />
              </div>

              <div className="md:w-1/2">
                <FormInput name="phonenumber" type="tel" label="เบอร์โทรศัพท์"
                  defaultValue={profile.phonenumber || ""} placeholder="เช่น 081-234-5678" />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  ที่อยู่ / ข้อมูลเพิ่มเติม
                </label>
                <textarea name="address" rows={4}
                  defaultValue={profile.address || ""}
                  placeholder="กรอกที่อยู่ หรือข้อมูลที่ต้องการบันทึก..."
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <Save className="w-5 h-5" /> บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </FormContainer>
          </div>
        </div>
      </div>
    </div>
  )
}