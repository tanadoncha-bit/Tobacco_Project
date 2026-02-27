import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Mail, Save } from "lucide-react"

import FormContainer from "@/components/form/FormContainer"
import FormInput from "@/components/form/FormInput"
import AvatarUploader from "@/components/form/AvatarUploader"
import { updateProfileAction } from "@/utils/actions"

export const dynamic = "force-dynamic"

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  // ดึงข้อมูลโปรไฟล์ล่าสุดจาก Database
  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id }
  })

  if (!profile) {
    return (
      <div className="flex flex-col justify-center items-center h-[80vh] w-full">
        <p className="text-gray-500 mb-4 text-lg">ไม่พบข้อมูลโปรไฟล์ผู้ดูแลระบบ</p>
        <Link href="/admin" className="text-purple-600 font-medium hover:underline">
          กลับไปหน้า Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 w-full animate-in fade-in duration-500">
      
      {/* ปุ่มย้อนกลับ */}
      <Link 
        href="/admin" 
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors mb-6 group"
      >
        <div className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 group-hover:border-purple-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        กลับหน้า Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ฝั่งซ้าย: Profile Card (แสดงผลอย่างเดียว) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* ภาพหน้าปก (Cover Photo) ใช้ Gradient เดียวกับ Sidebar */}
            <div className="h-32 w-full bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] relative"></div>
            
            <div className="px-6 pb-8 flex flex-col items-center text-center -mt-14 relative z-10">
              {/* รูป Avatar ที่จะทับอยู่บนหน้าปก */}
                <AvatarUploader />
              
              {/* ข้อมูลเบื้องต้น */}
              <h2 className="text-xl font-bold text-gray-900">
                {profile.firstname} {profile.lastname}
              </h2>
              
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-1.5">
                <Mail className="w-4 h-4" />
                {session.user?.email || "No email provided"}
              </div>

              {/* ป้ายบอก Role (เช่น Admin) */}
              <div className="mt-5 px-4 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-bold tracking-wide uppercase flex items-center gap-2 border border-purple-100 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                {session.user?.role || "Administrator"}
              </div>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: ฟอร์มแก้ไขข้อมูล (Edit Form) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
            
            <div className="mb-8 border-b border-gray-100 pb-6">
              <h3 className="text-2xl font-bold text-gray-900">จัดการข้อมูลส่วนตัว</h3>
              <p className="text-gray-500 mt-2 text-sm">
                อัปเดตข้อมูลส่วนตัวและช่องทางการติดต่อเพื่อให้ระบบแสดงผลได้อย่างถูกต้อง
              </p>
            </div>

            <FormContainer action={updateProfileAction} className="space-y-6">
              
              {/* ชื่อ-นามสกุล (แบ่ง 2 คอลัมน์) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput 
                    name="firstname" 
                    type="text" 
                    label="ชื่อจริง" 
                    defaultValue={profile.firstname} 
                />
                <FormInput 
                    name="lastname" 
                    type="text" 
                    label="นามสกุล" 
                    defaultValue={profile.lastname} 
                />
              </div>

              {/* เบอร์โทรศัพท์ (ความกว้างครึ่งเดียวเพื่อให้ดูไม่โล่งเกินไป) */}
              <div className="w-full md:w-[calc(50%-12px)]">
                <FormInput 
                    name="phonenumber" 
                    type="tel" 
                    label="เบอร์โทรศัพท์" 
                    defaultValue={profile.phonenumber || ""} 
                    placeholder="เช่น 081-234-5678"
                />
              </div>

              {/* ที่อยู่จัดส่ง/ติดต่อ */}
              <div className="space-y-2 pt-2">
                <label htmlFor="address" className="text-sm font-semibold text-gray-800">
                  ที่อยู่ / ข้อมูลติดต่อเพิ่มเติม
                </label>
                <textarea 
                  name="address" 
                  id="address"
                  rows={4}
                  defaultValue={profile.address || ""}
                  placeholder="กรอกที่อยู่ หรือข้อมูลที่ต้องการบันทึก..."
                  className="flex w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all resize-none shadow-sm"
                ></textarea>
              </div>

              {/* ปุ่มบันทึก */}
              <div className="pt-8 flex justify-end">
                <button 
                  type="submit" 
                  className="bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] text-white px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 focus:ring-4 focus:ring-purple-200 shadow-lg shadow-purple-500/30 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-5 h-5" />
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>

            </FormContainer>
          </div>
        </div>

      </div>
    </div>
  )
}