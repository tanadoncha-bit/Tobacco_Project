"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { LogIn, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await signIn("credentials", { email, password, redirect: false })

    if (res?.error) {
      toast.error(res.error, { position: "top-center" })
      setLoading(false)
    } else {
      toast.success("เข้าสู่ระบบสำเร็จ!", { position: "top-center" })
      const session = await getSession()
      if (session?.user?.role === "ADMIN" || session?.user?.role === "STAFF" || session?.user?.role === "MANAGER") {
        router.push("/admin")
      } else {
        router.push("/user")
      }
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(150deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-purple-200 mb-4">
            <LogIn className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">เข้าสู่ระบบ</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">ยินดีต้อนรับกลับมา</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="example@email.com"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black py-3.5 rounded-2xl hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all cursor-pointer mt-2"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 font-medium mt-6">
          ยังไม่มีบัญชีใช่ไหม?{" "}
          <Link href="/register" className="text-purple-600 font-bold hover:text-purple-700 transition-colors">
            สมัครสมาชิก
          </Link>
        </p>
      </div>
    </div>
  )
}