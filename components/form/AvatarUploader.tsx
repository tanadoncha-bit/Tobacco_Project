"use client"

import { useUser } from "@clerk/nextjs"
import { useRef, useState } from "react"
import { Camera } from "lucide-react"

export default function ProfileAvatarUploader() {
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      await user.setProfileImage({ file })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div
        className="relative group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Avatar */}
        <img
          src={user.imageUrl}
          alt="Profile"
          className="h-24 w-24 rounded-full object-cover border"
        />

        {/* Overlay */}
        <div className="
          absolute inset-0
          flex items-center justify-center
          rounded-full
          bg-black/40
          opacity-0
          group-hover:opacity-100
          transition
        ">
          <Camera className="text-white" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="
            absolute inset-0
            flex items-center justify-center
            rounded-full
            bg-black/50
            text-white text-sm
          ">
            Uploading...
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
