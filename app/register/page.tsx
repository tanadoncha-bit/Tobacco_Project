"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { UserPlus, Mail, Lock, User } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstname: "", lastname: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ", { position: "top-center" })
      router.push("/login")
    } catch (error: any) {
      toast.error(error.message, { position: "top-center" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[linear-gradient(150deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] p-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-purple-200 mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">สมัครสมาชิก</h1>
          <p className="text-sm text-gray-400 font-medium mt-1">สร้างบัญชีใหม่ได้เลย</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">ชื่อ</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="สมชาย"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  onChange={e => setForm({ ...form, firstname: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">นามสกุล</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="ใจดี"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                  onChange={e => setForm({ ...form, lastname: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="example@email.com"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                onChange={e => setForm({ ...form, email: e.target.value })}
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
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-black py-3.5 rounded-2xl hover:shadow-lg hover:shadow-purple-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none transition-all cursor-pointer mt-2"
          >
            {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 font-medium mt-6">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-purple-600 font-bold hover:text-purple-700 transition-colors">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  )
}