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

    if (file.size > 2 * 1024 * 1024) {
      toast.error("ขนาดรูปภาพต้องไม่เกิน 2MB")
      return
    }

    setLoading(true)

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
      })

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
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
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">

          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}

          {loading && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
              <Loader2 className="w-8 h-8 text-white animate-spin mb-1" />
            </div>
          )}

        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="absolute bottom-0 right-0 w-10 h-10 bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] rounded-full text-white flex items-center justify-center hover:opacity-90 transition shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer z-20"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

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