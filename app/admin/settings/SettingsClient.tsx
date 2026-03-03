"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
    Store, Phone, Mail, MapPin, Settings2, Save, Power,
    CreditCard, Building, User, Info, BookText, ImageIcon,
    Trash2, Eye, EyeOff, Plus, Loader2, UploadCloud,
} from "lucide-react"
import { addBannerAction, toggleBannerAction, deleteBannerAction } from "@/utils/actions"

type Banner = {
    id: string
    imageUrl: string
    isActive: boolean
}

const inputClass =
    "w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 bg-white transition-all"

const labelClass = "flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"

function SectionCard({
    icon,
    title,
    children,
}: {
    icon: React.ReactNode
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 bg-gray-50/30">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-sm shadow-purple-200">
                    {icon}
                </div>
                <h2 className="text-base font-black text-gray-900">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </div>
    )
}

export default function SettingsClient({
    initialSettings,
    initialBanners,
}: {
    initialSettings: any
    initialBanners: Banner[]
}) {
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
            // 1. ขอ signature จาก server
            const sigRes = await fetch("/api/upload/signature?folder=banners")
            const { signature, timestamp, cloudName, apiKey } = await sigRes.json()

            // 2. upload ตรงไป Cloudinary
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("signature", signature)
            formData.append("timestamp", timestamp)
            formData.append("api_key", apiKey)
            formData.append("folder", "banners")

            const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                { method: "POST", body: formData }
            )
            const cloudData = await cloudRes.json()
            if (!cloudData.secure_url) throw new Error("อัปโหลดรูปไม่สำเร็จ")

            // 3. บันทึก URL ลง DB
            const res = await addBannerAction(cloudData.secure_url)
            if (res.success) {
                toast.success("เพิ่มแบนเนอร์เรียบร้อย")
                setSelectedFile(null)
                if (res.banner) setBanners(prev => [...prev, res.banner])
            } else {
                toast.error(res.message)
            }
        } catch { toast.error("เกิดข้อผิดพลาดในการอัปโหลด") }
        finally { setIsUploading(false) }
    }

    const handleToggleBanner = async (id: string, currentStatus: boolean) => {
        const res = await toggleBannerAction(id, !currentStatus)
        if (res.success) {
            setBanners(banners.map(b => b.id === id ? { ...b, isActive: !currentStatus } : b))
            toast.success(currentStatus ? "ปิดการแสดงผลแล้ว" : "เปิดการแสดงผลแล้ว")
        }
    }

    const confirmDelete = async () => {
        if (!bannerToDelete) return
        const res = await deleteBannerAction(bannerToDelete)
        if (res.success) {
            setBanners(banners.filter(b => b.id !== bannerToDelete))
            toast.success("ลบแบนเนอร์เรียบร้อย")
        } else toast.error("ลบล้มเหลว")
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
                body: JSON.stringify(formData),
            })
            if (!res.ok) throw new Error("บันทึกไม่สำเร็จ")
            toast.success("บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!")
        } catch { toast.error("เกิดข้อผิดพลาดในการบันทึก") }
        finally { setIsLoading(false) }
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-2xl shadow-lg shadow-purple-200">
                    <Settings2 className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">System Settings</h1>
                    <p className="text-[16px] text-gray-500 font-medium mt-1">จัดการข้อมูลร้านค้า การตั้งค่าพื้นฐาน และภาพหน้าปกเว็บไซต์</p>
                </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">

                {/* ── ข้อมูลร้านค้า ── */}
                <SectionCard icon={<BookText className="w-4 h-4" />} title="ข้อมูลร้านค้า (Store Information)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className={labelClass}><Store className="w-4 h-4 text-gray-400" /> ชื่อร้านค้า</label>
                            <input type="text" required className={inputClass}
                                value={formData.storeName}
                                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}><Mail className="w-4 h-4 text-gray-400" /> อีเมลติดต่อ</label>
                            <input type="email" required className={inputClass}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}><Phone className="w-4 h-4 text-gray-400" /> เบอร์โทรศัพท์</label>
                            <input type="text" required className={inputClass}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}><MapPin className="w-4 h-4 text-gray-400" /> ที่อยู่ร้านค้า</label>
                            <textarea rows={3} required className={`${inputClass} resize-none`}
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* ── ช่องทางชำระเงิน ── */}
                <SectionCard icon={<CreditCard className="w-4 h-4" />} title="ช่องทางการชำระเงิน (Payment Settings)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={labelClass}><Building className="w-4 h-4 text-gray-400" /> ธนาคาร</label>
                            <input type="text" placeholder="เช่น ธนาคารกสิกรไทย" className={inputClass}
                                value={formData.bankName}
                                onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelClass}><CreditCard className="w-4 h-4 text-gray-400" /> เลขที่บัญชี</label>
                            <input type="text" placeholder="เช่น 123-4-56789-0" className={`${inputClass} font-mono`}
                                value={formData.accountNumber}
                                onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}><User className="w-4 h-4 text-gray-400" /> ชื่อบัญชี</label>
                            <input type="text" placeholder="เช่น บจก. โทแบคโค สโตร์ หรือ นายสมชาย ใจดี" className={inputClass}
                                value={formData.accountName}
                                onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* ── จัดการแบนเนอร์ ── */}
                <SectionCard icon={<ImageIcon className="w-4 h-4" />} title="จัดการรูปภาพแบนเนอร์ (Banner Slider)">

                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <input type="file" id="banner-upload" accept="image/*" className="hidden"
                            onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]) }}
                        />
                        <label htmlFor="banner-upload"
                            className={`flex-1 border-2 border-dashed rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-all ${selectedFile
                                ? "bg-purple-50 border-purple-300 text-purple-700"
                                : "bg-gray-50 border-gray-200 text-gray-400 hover:border-purple-300 hover:bg-purple-50/30"
                                }`}
                        >
                            <UploadCloud className={`w-5 h-5 shrink-0 ${selectedFile ? "text-purple-500" : "text-gray-400"}`} />
                            <span className="truncate text-sm font-medium">
                                {selectedFile ? selectedFile.name : "คลิกเพื่อเลือกไฟล์รูปภาพจากเครื่อง..."}
                            </span>
                        </label>
                        <button type="button" onClick={handleAddBanner} disabled={!selectedFile || isUploading}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md transition-all whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> กำลังอัปโหลด...</>
                                : <><Plus className="w-4 h-4" /> เพิ่มรูปลงสไลด์</>
                            }
                        </button>
                    </div>

                    {banners.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="bg-gray-100 rounded-full p-4">
                                <ImageIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-400 font-medium text-sm">ยังไม่มีรูปภาพแบนเนอร์ในระบบ</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {banners.map(banner => (
                                <div key={banner.id} className={`relative rounded-2xl overflow-hidden border-2 transition-all ${banner.isActive
                                    ? "border-purple-400 shadow-md shadow-purple-100"
                                    : "border-gray-200 opacity-60"
                                    }`}>
                                    <img src={banner.imageUrl} alt="Banner" className="w-full h-36 object-cover bg-gray-100" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                                        <button type="button"
                                            onClick={() => handleToggleBanner(banner.id, banner.isActive)}
                                            className="p-2.5 bg-white rounded-xl text-gray-800 hover:bg-blue-50 transition shadow-sm cursor-pointer"
                                            title={banner.isActive ? "ซ่อนรูปนี้" : "เปิดโชว์รูปนี้"}
                                        >
                                            {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        <button type="button"
                                            onClick={() => { setBannerToDelete(banner.id); setIsDeleteModalOpen(true) }}
                                            className="p-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-white transition shadow-sm cursor-pointer"
                                            title="ลบรูปนี้"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-xl text-[10px] font-bold text-white ${banner.isActive ? "bg-purple-500" : "bg-gray-500"
                                        }`}>
                                        {banner.isActive ? "แสดงผลอยู่" : "ซ่อน"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                {/* ── สถานะเว็บไซต์ ── */}
                <SectionCard icon={<Info className="w-4 h-4" />} title="สถานะเว็บไซต์ (Website Status)">
                    <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${formData.maintenanceMode
                        ? "bg-red-50/50 border-red-200"
                        : "bg-gray-50/50 border-gray-200"
                        }`}>
                        <div>
                            <h3 className="font-black text-gray-900 flex items-center gap-2">
                                <Power className={`w-4 h-4 ${formData.maintenanceMode ? "text-red-500" : "text-emerald-500"}`} />
                                โหมดปิดปรับปรุง (Maintenance Mode)
                            </h3>
                            <p className="text-sm text-gray-500 font-medium mt-1">
                                หากเปิดใช้งาน ลูกค้าจะไม่สามารถเข้าใช้งานหน้าเว็บไซต์ได้ชั่วคราว (เข้าได้เฉพาะ Admin)
                            </p>
                        </div>
                        <button type="button"
                            onClick={() => setFormData({ ...formData, maintenanceMode: !formData.maintenanceMode })}
                            className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors cursor-pointer ml-6 ${formData.maintenanceMode ? "bg-red-500" : "bg-gray-400"
                                }`}
                        >
                            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${formData.maintenanceMode ? "translate-x-8" : "translate-x-1"
                                }`} />
                        </button>
                    </div>
                </SectionCard>

                {/* ── Save ── */}
                <div className="flex justify-end pb-10">
                    <button type="submit" disabled={isLoading}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
                    >
                        {isLoading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> กำลังบันทึกข้อมูล...</>
                            : <><Save className="w-5 h-5" /> บันทึกการตั้งค่า</>
                        }
                    </button>
                </div>
            </form>

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 ring-8 ring-rose-50">
                                <Trash2 className="w-7 h-7 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">ยืนยันการลบรูปภาพ?</h3>
                            <p className="text-gray-500 font-medium text-sm mb-6">
                                รูปภาพแบนเนอร์นี้จะถูกลบออกจากระบบอย่างถาวร คุณแน่ใจหรือไม่?
                            </p>
                            <div className="flex gap-3 w-full">
                                <button type="button"
                                    onClick={() => { setIsDeleteModalOpen(false); setBannerToDelete(null) }}
                                    className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button type="button" onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
                                >
                                    ยืนยันลบ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}