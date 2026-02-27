"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Camera, Loader2, User } from "lucide-react"

export default function AvatarUploader() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ตรวจสอบขนาดไฟล์ (ไม่เกิน 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดรูปภาพต้องไม่เกิน 2MB")
      return
    }

    setLoading(true)

    try {
      // แปลงไฟล์เป็น Base64 String เพื่อส่งไป API
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        const base64Image = reader.result

        // ส่งรูปไปให้ API เราอัปโหลดขึ้น Cloudinary
        const res = await fetch("/api/profile/avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64Image }),
        })

        const data = await res.json()

        if (!res.ok) throw new Error(data.message)

        // สั่งอัปเดต Session ใหม่อัตโนมัติ (Navbar จะเปลี่ยนรูปทันที)
        await update({ image: data.imageUrl })
        
        toast.success("อัปเดตรูปโปรไฟล์สำเร็จ!", { position: "top-center" })
      }
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด", { position: "top-center" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {/* รูปโปรไฟล์ */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
          {session?.user?.image ? (
            <img 
              src={session.user.image} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* ปุ่มวงกลมซ้อนทับสำหรับกดอัปโหลด */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="absolute bottom-0 right-0 w-10 h-10 bg-[#2E4BB1] rounded-full text-white flex items-center justify-center hover:bg-blue-700 transition shadow-md disabled:opacity-50 cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </button>
      </div>

      {/* Input ไฟล์แบบซ่อน */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <p className="text-sm text-gray-500">
        รองรับไฟล์ JPEG, PNG ขนาดไม่เกิน 2MB
      </p>
    </div>
  )
}