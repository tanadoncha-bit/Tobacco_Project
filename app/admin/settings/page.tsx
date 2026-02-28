"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Store, Phone, Mail, MapPin, Settings2, Save, Power, CreditCard, Building, User, Info, BookText } from "lucide-react" 

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    phone: "",
    address: "",
    maintenanceMode: false,
    bankName: "",
    accountNumber: "",
    accountName: ""
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          setFormData({
            storeName: data.storeName || "",
            email: data.email || "",
            phone: data.phone || "",
            address: data.address || "",
            maintenanceMode: data.maintenanceMode || false,
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            accountName: data.accountName || ""
          })
        }
      } catch (error) {
        toast.error("ดึงข้อมูลการตั้งค่าล้มเหลว")
      } finally {
        setIsFetching(false)
      }
    }
    fetchSettings()
  }, [])

  // ฟังก์ชันบันทึกข้อมูลลง Database
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("บันทึกไม่สำเร็จ")
      
      toast.success("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!", { position: "top-center" })
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึก")
    } finally {
      setIsLoading(false)
    }
  }

  // แสดงตอนกำลังโหลดข้อมูลครั้งแรก
  if (isFetching) {
    return <div className="p-10 text-center text-gray-500">กำลังโหลดข้อมูลการตั้งค่า...</div>
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings2 className="text-purple-600" /> System Settings
        </h1>
        <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลร้านค้าและการตั้งค่าพื้นฐานของเว็บไซต์</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* ================= ส่วนที่ 1: ข้อมูลร้านค้า ================= */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <BookText size={20} className="text-blue-500" /> ข้อมูลร้านค้า (Store Information)
            </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Store size={16} className="text-gray-400"/> ชื่อร้านค้า
              </label>
              <input 
                type="text" 
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition" 
                value={formData.storeName} 
                onChange={e => setFormData({...formData, storeName: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail size={16} className="text-gray-400"/> อีเมลติดต่อ
              </label>
              <input 
                type="email" 
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone size={16} className="text-gray-400"/> เบอร์โทรศัพท์
              </label>
              <input 
                type="text" 
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400"/> ที่อยู่ร้านค้า
              </label>
              <textarea 
                rows={3}
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* ================= ส่วนที่ 2: ช่องทางการชำระเงิน ================= */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
             <CreditCard size={20} className="text-blue-500" /> ข้อมูลช่องทางการชำระเงิน (Payment Settings)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Building size={16} className="text-gray-400"/> ธนาคาร
              </label>
              <input 
                type="text" 
                placeholder="เช่น ธนาคารกสิกรไทย"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                value={formData.bankName} 
                onChange={e => setFormData({...formData, bankName: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CreditCard size={16} className="text-gray-400"/> เลขที่บัญชี
              </label>
              <input 
                type="text" 
                placeholder="เช่น 123-4-56789-0"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono" 
                value={formData.accountNumber} 
                onChange={e => setFormData({...formData, accountNumber: e.target.value})} 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User size={16} className="text-gray-400"/> ชื่อบัญชี
              </label>
              <input 
                type="text" 
                placeholder="เช่น บจก. โทแบคโค สโตร์ หรือ นายสมชาย ใจดี"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                value={formData.accountName} 
                onChange={e => setFormData({...formData, accountName: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* ================= ส่วนที่ 3: ตั้งค่าระบบเว็บ ================= */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <Info size={20} className="text-blue-500" />สถานะเว็บไซต์ (Website Status)
          </h2>
          
          <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Power size={18} className={formData.maintenanceMode ? "text-red-500" : "text-green-500"} /> 
                โหมดปิดปรับปรุง (Maintenance Mode)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                หากเปิดใช้งาน ลูกค้าจะไม่สามารถเข้าใช้งานหน้าเว็บไซต์ได้ชั่วคราว (เข้าได้เฉพาะ Admin)
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setFormData({...formData, maintenanceMode: !formData.maintenanceMode})}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                formData.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  formData.maintenanceMode ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ================= ปุ่มบันทึก ================= */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-70 shadow-md shadow-purple-200"
          >
            {isLoading ? (
              "กำลังบันทึกข้อมูล..."
            ) : (
              <>
                <Save size={20} /> บันทึกการตั้งค่า
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}