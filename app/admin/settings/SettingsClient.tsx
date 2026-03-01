"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
    Store, Phone, Mail, MapPin, Settings2, Save, Power,
    CreditCard, Building, User, Info, BookText, ImageIcon, Trash2, Eye, EyeOff, Plus,
    Loader2, UploadCloud
} from "lucide-react"
import { addBannerAction, toggleBannerAction, deleteBannerAction } from "@/utils/actions"

type Banner = {
    id: string
    imageUrl: string
    isActive: boolean
}

export default function SettingsClient({ initialSettings, initialBanners }: { initialSettings: any, initialBanners: Banner[] }) {

    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const [formData, setFormData] = useState(initialSettings)
    const [banners, setBanners] = useState<Banner[]>(initialBanners)

    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [bannerToDelete, setBannerToDelete] = useState<string | null>(null)

    const handleAddBanner = async () => {
        if (!selectedFile) return toast.error("กรุณาเลือกรูปภาพก่อนครับ")
        setIsUploading(true)
        try {
            const uploadData = new FormData()
            uploadData.append("file", selectedFile)

            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: uploadData,
            })

            if (!uploadRes.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ")
            const { imageUrl } = await uploadRes.json()

            const res = await addBannerAction(imageUrl)

            if (res.success) {
                toast.success("เพิ่มแบนเนอร์เรียบร้อย")
                setSelectedFile(null)
            } else {
                toast.error(res.message)
            }
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการอัปโหลด")
        } finally {
            setIsUploading(false)
        }
    }

    const handleToggleBanner = async (id: string, currentStatus: boolean) => {
        const res = await toggleBannerAction(id, !currentStatus)
        if (res.success) {
            setBanners(banners.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b))
            toast.success(currentStatus ? "ปิดการแสดงผลแล้ว" : "เปิดการแสดงผลแล้ว")
        }
    }

    const clickDeleteBanner = (id: string) => {
        setBannerToDelete(id)
        setIsDeleteModalOpen(true)
    }

    const confirmDelete = async () => {
        if (!bannerToDelete) return
        const res = await deleteBannerAction(bannerToDelete)
        if (res.success) {
            setBanners(banners.filter(b => b.id !== bannerToDelete))
            toast.success("ลบแบนเนอร์เรียบร้อย")
        } else {
            toast.error("ลบล้มเหลว")
        }
        setIsDeleteModalOpen(false)
        setBannerToDelete(null)
    }

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
            toast.success("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!")
        } catch (error) {
            toast.error("เกิดข้อผิดพลาดในการบันทึก")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Settings2 className="text-purple-600" /> System Settings
                </h1>
                <p className="text-gray-500 text-sm mt-2 mb-5">จัดการข้อมูลร้านค้า การตั้งค่าพื้นฐาน และภาพหน้าปกเว็บไซต์</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">

                {/* ================= ข้อมูลร้านค้า ================= */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <BookText size={20} className="text-purple-500" /> ข้อมูลร้านค้า (Store Information)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Store size={16} className="text-gray-400" /> ชื่อร้านค้า
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                                value={formData.storeName}
                                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Mail size={16} className="text-gray-400" /> อีเมลติดต่อ
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Phone size={16} className="text-gray-400" /> เบอร์โทรศัพท์
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" /> ที่อยู่ร้านค้า
                            </label>
                            <textarea
                                rows={3}
                                required
                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition resize-none"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* ================= ช่องทางการชำระเงิน ================= */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <CreditCard size={20} className="text-purple-500" /> ข้อมูลช่องทางการชำระเงิน (Payment Settings)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <Building size={16} className="text-gray-400" /> ธนาคาร
                            </label>
                            <input
                                type="text"
                                placeholder="เช่น ธนาคารกสิกรไทย"
                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={formData.bankName}
                                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <CreditCard size={16} className="text-gray-400" /> เลขที่บัญชี
                            </label>
                            <input
                                type="text"
                                placeholder="เช่น 123-4-56789-0"
                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono"
                                value={formData.accountNumber}
                                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                <User size={16} className="text-gray-400" /> ชื่อบัญชี
                            </label>
                            <input
                                type="text"
                                placeholder="เช่น บจก. โทแบคโค สโตร์ หรือ นายสมชาย ใจดี"
                                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                value={formData.accountName}
                                onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* ================= จัดการแบนเนอร์ ================= */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <ImageIcon size={20} className="text-purple-500" /> จัดการรูปภาพแบนเนอร์ (Banner Slider)
                    </h2>

                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <input
                            type="file"
                            id="banner-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setSelectedFile(e.target.files[0])
                                }
                            }}
                        />
                        <label
                            htmlFor="banner-upload"
                            className={`flex-1 border rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer transition hover:border-purple-400 ${selectedFile ? "bg-purple-50 border-purple-300" : "bg-white"
                                }`}
                        >
                            <UploadCloud size={20} className={selectedFile ? "text-purple-600" : "text-gray-400"} />
                            <span className={`flex-1 truncate text-sm ${selectedFile ? "text-purple-700 font-medium" : "text-gray-400"}`}>
                                {selectedFile ? selectedFile.name : "คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง..."}
                            </span>
                        </label>
                        <button
                            type="button"
                            onClick={handleAddBanner}
                            disabled={!selectedFile || isUploading}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition shadow-sm whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            {isUploading ? "กำลังอัปโหลด..." : "เพิ่มรูปลงสไลด์"}
                        </button>

                    </div>

                    {banners.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                            ยังไม่มีรูปภาพแบนเนอร์ในระบบ
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {banners.map(banner => (
                                <div key={banner.id} className={`relative rounded-xl overflow-hidden border-2 transition-all ${banner.isActive ? "border-blue-500 shadow-md" : "border-gray-200 opacity-60"}`}>
                                    <img src={banner.imageUrl} alt="Banner" className="w-full h-32 object-cover bg-gray-100" />

                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                                            className="p-2 bg-white rounded-full text-gray-800 hover:bg-blue-100 transition shadow-sm cursor-pointer"
                                            title={banner.isActive ? "ซ่อนรูปนี้" : "เปิดโชว์รูปนี้"}
                                        >
                                            {banner.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => clickDeleteBanner(banner.id)}
                                            className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition shadow-sm cursor-pointer"
                                            title="ลบรูปนี้"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold text-white ${banner.isActive ? "bg-purple-500" : "bg-gray-500"}`}>
                                        {banner.isActive ? "แสดงผลอยู่" : "ซ่อน"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ================= ตั้งค่าระบบเว็บ ================= */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
                        <Info size={20} className="text-purple-500" />สถานะเว็บไซต์ (Website Status)
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
                            onClick={() => setFormData({ ...formData, maintenanceMode: !formData.maintenanceMode })}
                            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors cursor-pointer ${formData.maintenanceMode ? 'bg-red-500' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform cursor-pointer ${formData.maintenanceMode ? 'translate-x-8' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-4 pb-10">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-70 shadow-md shadow-purple-200 cursor-pointer"
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
            {/* ================= Modal ยืนยันการลบแบนเนอร์ ================= */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center">

                            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="w-7 h-7 text-red-600" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">ยืนยันการลบรูปภาพ?</h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                รูปภาพแบนเนอร์นี้จะถูกลบออกจากระบบอย่างถาวร คุณแน่ใจหรือไม่ว่าต้องการลบ?
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsDeleteModalOpen(false)
                                        setBannerToDelete(null)
                                    }}
                                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition shadow-sm shadow-red-200 cursor-pointer"
                                >
                                    ยืนยัน
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}