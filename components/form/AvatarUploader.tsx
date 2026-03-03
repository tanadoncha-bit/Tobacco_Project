"use client"

import { useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Camera, Loader2, User } from "lucide-react"

export default function AvatarUploader() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // วิธีที่เร็วที่สุด — upload ตรงจาก client ไป Cloudinary
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) return toast.error("ขนาดรูปภาพต้องไม่เกิน 2MB")

    setLoading(true)
    try {
      // 1. ขอ signature จาก server ก่อน
      const sigRes = await fetch("/api/upload/signature?folder=avatars")
      const { signature, timestamp, cloudName, apiKey } = await sigRes.json()

      // 2. upload ตรงไป Cloudinary
      const formData = new FormData()
      formData.append("file", file)
      formData.append("signature", signature)
      formData.append("timestamp", timestamp)
      formData.append("api_key", apiKey)
      formData.append("folder", "avatars")

      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      )
      const cloudData = await cloudRes.json()

      // 3. บันทึก URL ลง DB
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: cloudData.secure_url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      await update({ image: data.imageUrl })
      toast.success("อัปเดตรูปโปรไฟล์สำเร็จ!", { position: "top-center" })
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด", { position: "top-center" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 mb-3">
      <div className="relative group">
        <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
          {session?.user?.image
            ? <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
            : <User className="w-10 h-10 text-gray-300" />
          }
          {loading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-[2px] rounded-full">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="absolute bottom-0 right-0 w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full text-white flex items-center justify-center shadow-md hover:shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-70 cursor-pointer z-20"
        >
          <Camera className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-400 font-medium">JPEG, PNG ไม่เกิน 2MB</p>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
    </div>
  )
}