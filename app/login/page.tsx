"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      toast.error(res.error, { position: "top-center" })
      setLoading(false) // อย่าลืมปิด loading กรณี error ด้วยนะครับ
    } else {
      toast.success("เข้าสู่ระบบสำเร็จ!", { position: "top-center" })

      const session = await getSession()

      if (session?.user?.role === "ADMIN") {
        router.push("/admin")
      } else if (session?.user?.role === "STAFF") {
        router.push("/admin")
      } else if (session?.user?.role === "MANAGER") {
        router.push("/admin")
      }
      else {
        router.push("/user")
      }

      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(150deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">เข้าสู่ระบบ</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white font-bold py-2.5 rounded-lg hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "กำลังโหลด..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ยังไม่มีบัญชีใช่ไหม? <Link href="/register" className="text-blue-600 hover:underline">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  )
}