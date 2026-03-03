"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  UserPlus, Shield, User, X, Edit, Check,
  ChevronDown, ContactRound, Users, Crown, Briefcase,
} from "lucide-react"

type Stats = {
  totalEmployees: number
  admins: number
  managers: number
  staff: number
}

export default function EmployeeManagementClient({
  initialEmployees,
  stats,
}: {
  initialEmployees: any[]
  stats: Stats
}) {
  const [employees, setEmployees] = useState<any[]>(initialEmployees)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstname: "", lastname: "", email: "", password: "", role: "STAFF",
  })

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/admin/employees")
      const data = await res.json()
      if (res.ok) setEmployees(data)
    } catch (e) { console.error(e) }
  }

  const openCreateModal = () => {
    setIsEditMode(false); setEditingId(null)
    setFormData({ firstname: "", lastname: "", email: "", password: "", role: "STAFF" })
    setIsModalOpen(true)
  }

  const openEditModal = (emp: any) => {
    setIsEditMode(true); setEditingId(emp.id)
    setFormData({ firstname: emp.firstname, lastname: emp.lastname || "", email: emp.email, password: "", role: emp.role })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const method = isEditMode ? "PUT" : "POST"
      const payload = isEditMode ? { ...formData, id: editingId } : formData
      const res = await fetch("/api/admin/employees", {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success(isEditMode ? "อัปเดตข้อมูลสำเร็จ!" : "เพิ่มพนักงานเรียบร้อยแล้ว!")
      setIsModalOpen(false)
      fetchEmployees()
    } catch (e: any) { toast.error(e.message) }
    finally { setIsLoading(false) }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-rose-50 text-rose-600 border-rose-200"
      case "MANAGER": return "bg-blue-50 text-blue-600 border-blue-200"
      default: return "bg-emerald-50 text-emerald-600 border-emerald-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Admin"
      case "MANAGER": return "Manager"
      default: return "Staff"
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
          <ContactRound className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Employee Management</h1>
          <p className="text-[16px] text-gray-500 font-medium mt-1">รายชื่อแอดมิน และพนักงานทั้งหมดในระบบ</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "พนักงานทั้งหมด", value: stats.totalEmployees, icon: <Users className="w-6 h-6" />, gradient: "from-indigo-500 to-purple-600", shadow: "shadow-purple-200" },
          { label: "Admin", value: stats.admins, icon: <Crown className="w-6 h-6" />, gradient: "from-rose-500 to-red-600", shadow: "shadow-rose-200" },
          { label: "Manager", value: stats.managers, icon: <Briefcase className="w-6 h-6" />, gradient: "from-blue-400 to-indigo-500", shadow: "shadow-blue-200" },
          { label: "Staff", value: stats.staff, icon: <User className="w-6 h-6" />, gradient: "from-emerald-400 to-teal-500", shadow: "shadow-emerald-200" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-6 flex items-center gap-5 group">
            <div className={`bg-gradient-to-br ${card.gradient} rounded-2xl p-4 shadow-lg ${card.shadow} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500 font-bold mb-1">{card.label}</p>
              <p className="text-3xl font-black text-gray-900">
                {card.value} <span className="text-base font-semibold text-gray-400">คน</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100">

        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/30 rounded-t-3xl flex justify-between items-center">
          <p className="text-sm font-bold text-gray-500">
            พนักงานทั้งหมด <strong className="text-gray-900">{employees.length}</strong> คน
          </p>
          <button
            onClick={openCreateModal}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> เพิ่มพนักงานใหม่
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["ชื่อ-นามสกุล", "อีเมล", "ตำแหน่ง (Role)", "จัดการ"].map(h => (
                  <th
                    key={h}
                    className={`
          py-5 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap
          ${h === "จัดการ" ? "px-6 text-center" : "px-6"}
        `}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="bg-gray-50 rounded-full p-6 ring-8 ring-gray-50/50">
                        <Users className="w-10 h-10 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-bold text-lg">ยังไม่มีข้อมูลพนักงาน</p>
                        <p className="text-gray-400 font-medium mt-1">กดปุ่ม "เพิ่มพนักงานใหม่" เพื่อเริ่มต้น</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-indigo-50/20 transition-colors group">

                    {/* ชื่อ */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-sm group-hover:shadow-md transition-all">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt="Profile" className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            <User className="w-4 h-4" strokeWidth={2.5} />
                          )}
                        </div>
                        <p className="font-semibold text-gray-800 group-hover:text-indigo-700 transition-colors">
                          {emp.firstname} {emp.lastname}
                        </p>
                      </div>
                    </td>

                    {/* อีเมล */}
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{emp.email}</td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${getRoleBadge(emp.role)}`}>
                        <Shield className="w-3 h-3" /> {getRoleLabel(emp.role)}
                      </span>
                    </td>

                    {/* จัดการ */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="inline-flex items-center gap-1.5 bg-white text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" /> แก้ไข
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {employees.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 rounded-b-3xl">
            <span className="text-sm font-medium text-gray-500">
              แสดงผลทั้งหมด <strong className="text-gray-900">{employees.length}</strong> รายการ
            </span>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">

            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2 rounded-xl">
                  {isEditMode ? <Edit className="w-4 h-4 text-white" /> : <UserPlus className="w-4 h-4 text-white" />}
                </div>
                <h2 className="text-lg font-black text-gray-900">
                  {isEditMode ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">ชื่อจริง</label>
                  <input required type="text"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium"
                    value={formData.firstname}
                    onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">นามสกุล</label>
                  <input required type="text"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium"
                    value={formData.lastname}
                    onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">อีเมลสำหรับเข้าระบบ</label>
                <input required type="email" disabled={isEditMode}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium disabled:bg-gray-50 disabled:text-gray-400"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  รหัสผ่าน{" "}
                  {isEditMode && <span className="text-[11px] text-gray-400 font-normal normal-case">(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
                </label>
                <input type="password" minLength={6} required={!isEditMode}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium"
                  placeholder={isEditMode ? "••••••••" : "อย่างน้อย 6 ตัวอักษร"}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Role dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">ตำแหน่ง (Role)</label>
                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white hover:border-purple-300 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none cursor-pointer font-bold text-gray-700"
                >
                  {formData.role === "ADMIN" ? "Admin - ดูแลระบบหลัก" :
                    formData.role === "MANAGER" ? "Manager - ผู้จัดการ" :
                      "Staff - พนักงานทั่วไป"}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isRoleOpen ? "rotate-180 text-purple-500" : ""}`} />
                </button>

                {isRoleOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsRoleOpen(false)} />
                    <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 overflow-hidden">
                      {[
                        { id: "ADMIN", title: "Admin", desc: "ดูแลระบบหลัก" },
                        { id: "MANAGER", title: "Manager", desc: "ผู้จัดการ" },
                        { id: "STAFF", title: "Staff", desc: "พนักงานทั่วไป" },
                      ].map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setFormData({ ...formData, role: r.id }); setIsRoleOpen(false) }}
                          className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors cursor-pointer ${formData.role === r.id
                            ? "bg-purple-50 text-purple-700 border-l-4 border-purple-500"
                            : "text-gray-700 hover:bg-gray-50 border-l-4 border-transparent"
                            }`}
                        >
                          <div>
                            <p className="font-bold">{r.title}</p>
                            <p className={`text-[11px] ${formData.role === r.id ? "text-purple-400" : "text-gray-400"}`}>{r.desc}</p>
                          </div>
                          {formData.role === r.id && <Check className="w-4 h-4 text-purple-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit" disabled={isLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isLoading ? "กำลังบันทึก..." : "ยืนยันการบันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}