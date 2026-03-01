"use client"

import { useState } from "react"
import { toast } from "sonner"
import { UserPlus, Shield, User, X, Edit, Check, ChevronDown, ContactRound } from "lucide-react"

export default function EmployeeManagementClient({ initialEmployees }: { initialEmployees: any[] }) {
  const [employees, setEmployees] = useState<any[]>(initialEmployees)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [isRoleOpen, setIsRoleOpen] = useState(false)

  const [isLoading, setIsLoading] = useState(false)


  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "STAFF"
  })

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/admin/employees")
      const data = await res.json()
      if (res.ok) setEmployees(data)
    } catch (error) {
      console.error("Error fetching employees:", error)
    }
  }

  const openCreateModal = () => {
    setIsEditMode(false)
    setEditingId(null)
    setFormData({ firstname: "", lastname: "", email: "", password: "", role: "STAFF" })
    setIsModalOpen(true)
  }

  const openEditModal = (emp: any) => {
    setIsEditMode(true)
    setEditingId(emp.id)
    setFormData({
      firstname: emp.firstname,
      lastname: emp.lastname || "",
      email: emp.email,
      password: "",
      role: emp.role
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const method = isEditMode ? "PUT" : "POST"
      const payload = isEditMode ? { ...formData, id: editingId } : formData

      const res = await fetch("/api/admin/employees", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message)

      toast.success(isEditMode ? "อัปเดตข้อมูลสำเร็จ!" : "เพิ่มพนักงานเรียบร้อยแล้ว!")
      setIsModalOpen(false)
      fetchEmployees()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ContactRound className="w-7 h-7 text-purple-600" />
            Employee Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">รายชื่อแอดมิน และพนักงานทั้งหมดในระบบ</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm shadow-purple-200 transition-all active:scale-95 cursor-pointer"
        >
          <UserPlus size={18} /> เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">ชื่อ-นามสกุล</th>
                <th className="px-6 py-4 font-medium">อีเมล</th>
                <th className="px-6 py-4 font-medium">ตำแหน่ง (Role)</th>
                <th className="px-6 py-4 font-medium text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400 text-sm">
                    <User size={32} className="mx-auto mb-3 opacity-20" />
                    ยังไม่มีข้อมูลพนักงาน
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                        {emp.profileImage ? (
                          <img src={emp.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User size={16} strokeWidth={2.5} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          {emp.firstname} {emp.lastname}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{emp.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide flex items-center w-fit gap-1.5
                        ${emp.role === 'ADMIN' ? 'bg-red-50 text-red-600 border border-red-100' :
                          emp.role === 'MANAGER' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            'bg-green-50 text-green-600 border border-green-100'}
                      `}>
                        <Shield size={12} /> {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-50 flex items-center justify-center p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {isEditMode ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">ชื่อจริง</label>
                  <input required type="text"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    value={formData.firstname} onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">นามสกุล</label>
                  <input required type="text"
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    value={formData.lastname} onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">อีเมลสำหรับเข้าระบบ</label>
                <input required type="email"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                  disabled={isEditMode}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  รหัสผ่าน {isEditMode && <span className="text-[11px] text-gray-400 font-normal normal-case">(เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)</span>}
                </label>
                <input
                  type="password"
                  minLength={6}
                  required={!isEditMode}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  placeholder={isEditMode ? "••••••••" : "อย่างน้อย 6 ตัวอักษร"}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  ตำแหน่ง (Role)
                </label>

                <button
                  type="button"
                  onClick={() => setIsRoleOpen(!isRoleOpen)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none cursor-pointer"
                >
                  <span className="text-gray-700 font-medium">
                    {formData.role === "ADMIN" ? "Admin (ดูแลระบบหลัก)" :
                      formData.role === "MANAGER" ? "Manager (ผู้จัดการ)" :
                        "Staff (พนักงานทั่วไป)"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-200 ${isRoleOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isRoleOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsRoleOpen(false)}></div>

                    <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-lg shadow-purple-900/5 py-1.5 overflow-hidden">
                      {[
                        { id: "ADMIN", title: "Admin", desc: "ดูแลระบบหลัก" },
                        { id: "MANAGER", title: "Manager", desc: "ผู้จัดการ" },
                        { id: "STAFF", title: "Staff", desc: "พนักงานทั่วไป" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors flex flex-col relative z-50 cursor-pointer
              ${formData.role === r.id ? "bg-purple-50/50 text-purple-700" : "text-gray-700"}
            `}
                          onClick={() => {
                            setFormData({ ...formData, role: r.id })
                            setIsRoleOpen(false)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{r.title}</span>
                            {formData.role === r.id && <Check size={16} className="text-purple-600" />}
                          </div>
                          <span className={`text-[11px] ${formData.role === r.id ? "text-purple-500/80" : "text-gray-400"}`}>
                            {r.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-5 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer">
                  ยกเลิก
                </button>
                <button type="submit" disabled={isLoading}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-purple-200 disabled:opacity-50 transition-all cursor-pointer">
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