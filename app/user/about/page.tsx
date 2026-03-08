"use client"

import Link from "next/link"
import { ArrowLeft, CheckCircle2, Mail, X } from "lucide-react"
import { useState } from "react"

type Member = {
    name: string
    id: string
    role: string
    roleEn: string
    description: string
    color: string
    bg: string
    border: string
    image: string | null
    email?: string
    ig?: string
    fb?: string
    featured?: boolean
}

type Advisor = {
    name: string
    title: string
    dept: string
    university: string
    image: string | null
    email?: string
    ig?: string
    fb?: string
}

const ADVISOR: Advisor = {
    name: "ผศ.ดร.พุธษดี ศิริแสงตระกูล",
    title: "ผู้ช่วยศาสตราจารย์",
    dept: "สาขาวิชาวิทยาการคอมพิวเตอร์",
    university: "มหาวิทยาลัยขอนแก่น",
    image: "https://res.cloudinary.com/djda6blnw/image/upload/v1772957115/1661876218-pusadeeseresangtakul1_1_sejjrr.png",
    email: "pusadee@kku.ac.th",
    ig: "",
    fb: "",
}

const TEAM: Member[] = [
    {
        name: "นางสาวกัญญาภัค ทองวิเศษ",
        id: "673380391-3",
        role: "Frontend Developer",
        roleEn: "UI/UX & Frontend",
        description: "รับผิดชอบการออกแบบและพัฒนาหน้าจอฝั่งผู้ใช้งาน ให้สวยงามและใช้งานง่าย",
        color: "from-pink-400 to-rose-500",
        bg: "bg-pink-50",
        border: "border-pink-100",
        image: "https://res.cloudinary.com/djda6blnw/image/upload/v1772639610/S__6062084_bfedu4.jpg",
        email: "Kanyapak.t@kkumail.com", ig: "cmshiopeah", fb: "",
    },
    {
        name: "นางสาวนันทพร ลุนทอง",
        id: "673380409-0",
        role: "Frontend Developer",
        roleEn: "UI/UX & Frontend",
        description: "ออกแบบ UI Components และระบบ responsive layout สำหรับทุกขนาดหน้าจอ",
        color: "from-violet-400 to-purple-500",
        bg: "bg-violet-50",
        border: "border-violet-100",
        image: "https://res.cloudinary.com/djda6blnw/image/upload/v1772639611/S__60317699_nr84im.jpg",
        email: "Nunthaporn.l@kkumail.com", ig: "ppeekkkkyy", fb: "",
    },
    {
        name: "นางสาวอลิชา ชนะบุญ",
        id: "673380431-7",
        role: "Frontend Developer",
        roleEn: "Frontend & Testing",
        description: "พัฒนาหน้าจอและทดสอบระบบ ตรวจสอบความถูกต้องของฟีเจอร์ต่างๆ",
        color: "from-teal-400 to-emerald-500",
        bg: "bg-teal-50",
        border: "border-teal-100",
        image: "https://res.cloudinary.com/djda6blnw/image/upload/v1772639615/S__3817481_pudl0i.jpg",
        email: "Alicha.c@kkumail.com", ig: "moowan_ac", fb: "",
    },
    {
        name: "นายธนดล ไชยศิลา",
        id: "673380585-0",
        role: "Fullstack Developer",
        roleEn: "Fullstack & DB Architect",
        description: "พัฒนาระบบทั้ง Frontend และ Backend รวมถึงออกแบบโครงสร้างฐานข้อมูลทั้งหมด",
        color: "from-indigo-500 to-blue-600",
        bg: "bg-indigo-50",
        border: "border-indigo-100",
        image: "https://res.cloudinary.com/djda6blnw/image/upload/v1772639952/IMG_7160_dhvm2k.jpg",
        email: "Tanadon.cha@kkumail.com", ig: "boom_tanadd", fb: "Tanadon Chaisila", featured: true,
    },
    {
        name: "นางสาวปรายฝน ฮกเซ็ง",
        id: "673380591-5",
        role: "Backend Developer",
        roleEn: "Backend & API",
        description: "พัฒนา API และระบบหลังบ้าน จัดการ Business Logic และความปลอดภัยของระบบ",
        color: "from-amber-400 to-orange-500",
        bg: "bg-amber-50",
        border: "border-amber-100",
        image: "https://res.cloudinary.com/djda6blnw/image/upload/v1772639609/4432_hjhaej.jpg",
        email: "Prayfon.h@kkumail.com", ig: "ishiterumeow", fb: "",
    },
    {
        name: "นางสาวปวริศา สีดาชมภู",
        id: "673380592-3",
        role: "Database Developer",
        roleEn: "Database & Documentation",
        description: "จัดการฐานข้อมูลและเขียนเอกสารประกอบโครงการ ดูแลความถูกต้องของข้อมูล",
        color: "from-cyan-400 to-sky-500",
        bg: "bg-cyan-50",
        border: "border-cyan-100",
        image: "https://res.cloudinary.com/djda6blnw/image/upload/v1772639611/S__87506951_i1gazr.jpg",
        email: "Pawarisa.see@kkumail.com", ig: "_somshine_", fb: "",
    },
]

const TECH_STACK = [
    { name: "Next.js 16", desc: "React Framework", color: "bg-gray-900 text-white" },
    { name: "TypeScript", desc: "Type Safety", color: "bg-blue-600 text-white" },
    { name: "PostgreSQL", desc: "Database", color: "bg-blue-800 text-white" },
    { name: "Prisma ORM", desc: "Database ORM", color: "bg-indigo-600 text-white" },
    { name: "NextAuth", desc: "Authentication", color: "bg-purple-600 text-white" },
    { name: "Tailwind CSS", desc: "Styling", color: "bg-teal-500 text-white" },
    { name: "Cloudinary", desc: "Image Storage", color: "bg-blue-500 text-white" },
    { name: "Vercel", desc: "Deployment", color: "bg-black text-white" },
]

const TIMELINE = [
    { month: "กุมภาพันธ์ 2568", title: "เริ่มต้นโปรเจกต์", desc: "วิเคราะห์ความต้องการ ออกแบบ Database และวางแผนระบบ" },
    { month: "มีนาคม 2568", title: "พัฒนาระบบหลัก", desc: "พัฒนา Backend API, ระบบ Authentication และ Stock Management" },
    { month: "มีนาคม 2568", title: "พัฒนา Frontend", desc: "ออกแบบและพัฒนาหน้าจอทั้งฝั่ง User และ Admin" },
    { month: "มีนาคม 2568", title: "ทดสอบและส่งงาน", desc: "ทดสอบระบบ แก้ไข Bug และส่งมอบโปรเจกต์" },
]

const IGIcon = () => (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
)

const FBIcon = () => (
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
)

function SocialLinks({ email, ig, fb }: { email?: string, ig?: string, fb?: string }) {
    if (!email && !ig && !fb) return null
    return (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100 mt-3">
            {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-1.5 text-xs font-bold text-white bg-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors truncate max-w-full">
                    <Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{email}</span>
                </a>
            )}
            {ig && (
                <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
                    <IGIcon />{ig}
                </a>
            )}
            {fb && (
                <a href={`https://facebook.com/${fb}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors">
                    <FBIcon />{fb}
                </a>
            )}
        </div>
    )
}

// Modal แบบ fullscreen overlay — ใช้ได้ทั้ง desktop และ mobile
function ProfileModal({ person, type, onClose }: {
    person: Member | (Advisor & { id?: string, roleEn?: string, role?: string, description?: string, color?: string, bg?: string, border?: string, featured?: boolean })
    type: "member" | "advisor"
    onClose: () => void
}) {
    const isMember = type === "member"
    const m = person as Member
    const a = person as Advisor

    const gradientColor = isMember ? m.color : "from-indigo-400 to-purple-500"
    const displayName = isMember ? m.name : a.name
    const displaySub = isMember ? m.roleEn : a.title

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* รูปเต็ม */}
                <div className={`relative w-full h-64 bg-gradient-to-br ${gradientColor}`}>
                    {person.image
                        ? <img src={person.image} alt={displayName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-8xl font-black opacity-20">{displayName[3]}</span>
                        </div>
                    }
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-5">
                        <p className="text-white font-black text-lg drop-shadow">{displayName}</p>
                        <p className="text-white/80 text-sm font-medium">{displaySub}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm cursor-pointer"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* ข้อมูล */}
                <div className="p-5 space-y-2.5">
                    {isMember ? (
                        <>
                            <Row label="รหัส" value={m.id} />
                            <Row label="ตำแหน่ง" value={m.role} />
                            <Row label="หน้าที่" value={m.description} />
                        </>
                    ) : (
                        <>
                            <Row label="ตำแหน่ง" value={a.title} />
                            <Row label="สาขาวิชา" value={a.dept} />
                            <Row label="มหาวิทยาลัย" value={a.university} />
                        </>
                    )}
                    <SocialLinks email={person.email} ig={isMember ? m.ig : a.ig} fb={isMember ? m.fb : a.fb} />
                </div>
            </div>
        </div>
    )
}

function Row({ label, value }: { label: string, value?: string }) {
    if (!value) return null
    return (
        <div className="flex gap-3 text-sm">
            <span className="text-gray-400 font-medium w-20 shrink-0">{label}</span>
            <span className="text-gray-700 font-semibold leading-relaxed">{value}</span>
        </div>
    )
}

function MemberCard({ member }: { member: Member }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className={`bg-white rounded-3xl border ${member.border} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden`}
            >
                {/* รูปด้านบน */}
                <div className={`relative w-full h-40 bg-gradient-to-br ${member.color} overflow-hidden`}>
                    {member.image
                        ? <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <span className="text-white text-5xl font-black opacity-20">{member.name[3]}</span>
                        </div>
                    }
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* ชื่อ + รหัส */}
                <div className="p-4">
                    <p className="font-black text-gray-900 text-sm leading-tight">{member.name}</p>
                    <div className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-gradient-to-r ${member.color} text-white`}>
                        {member.role}
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-1.5">{member.id}</p>
                    <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed line-clamp-2">{member.description}</p>
                    <div className="flex gap-2 mt-3">
                        {member.ig && <span className="flex items-center gap-1 text-[10px] font-bold text-pink-500"><IGIcon />IG</span>}
                        {member.fb && <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500"><FBIcon />FB</span>}
                        {member.email && <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500"><Mail className="w-3 h-3" />Email</span>}
                    </div>
                </div>
            </div>

            {open && <ProfileModal person={member} type="member" onClose={() => setOpen(false)} />}
        </>
    )
}

function AdvisorCard({ advisor }: { advisor: Advisor }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="flex items-center gap-5 cursor-pointer group p-4 rounded-2xl hover:bg-indigo-50/50 transition-colors -m-4"
            >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 shrink-0 overflow-hidden shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    {advisor.image
                        ? <img src={advisor.image} alt={advisor.name} className="w-full h-full object-cover" />
                        : <span className="text-white text-2xl font-black flex items-center justify-center h-full">{advisor.name[4]}</span>
                    }
                </div>
                <div>
                    <p className="text-lg font-black text-gray-900 group-hover:text-indigo-700 transition-colors">{advisor.name}</p>
                    <p className="text-sm text-gray-500 font-medium mt-0.5">{advisor.title}</p>
                    <p className="text-sm text-gray-500 font-medium">{advisor.dept}</p>
                    <p className="text-xs text-indigo-400 font-bold mt-1">แตะเพื่อดูข้อมูลเพิ่มเติม →</p>
                </div>
            </div>

            {open && <ProfileModal person={advisor} type="advisor" onClose={() => setOpen(false)} />}
        </>
    )
}

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">

            {/* Hero */}
            <div className="relative bg-[linear-gradient(135deg,#1e1b4b_0%,#312e81_40%,#4338ca_70%,#6366f1_100%)] overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute bottom-0 right-20 w-96 h-96 rounded-full bg-purple-300/10 blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-400/5 blur-3xl" />
                </div>
                <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-bold px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        โปรเจกต์วิชา CP352003
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mb-4 leading-none">
                        About<br /><span className="text-indigo-300">Us</span>
                    </h1>
                    <p className="text-white/60 text-base md:text-lg font-medium max-w-xl mx-auto leading-relaxed mt-6">
                        ทีมนักศึกษาที่ร่วมกันพัฒนาระบบจัดการร้านค้าออนไลน์ครบวงจร
                    </p>
                    {/* member avatars preview */}
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {TEAM.map(m => (
                            <div key={m.id} className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 shadow-lg">
                                {m.image
                                    ? <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                    : <span className="text-white text-xs font-black flex items-center justify-center h-full">{m.name[3]}</span>
                                }
                            </div>
                        ))}
                        <span className="text-white/60 text-sm font-medium ml-2">6 สมาชิก</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-12 space-y-14">

                <Link href="/user" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors group">
                    <div className="p-1.5 rounded-full bg-white shadow-sm border border-gray-200 group-hover:border-indigo-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    กลับหน้าหลัก
                </Link>

                {/* Project info */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="p-8">
                        <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full inline-block" />
                            ข้อมูลโปรเจกต์
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {[
                                    { label: "ชื่อโปรเจกต์", value: "ระบบจัดการร้านค้าออนไลน์" },
                                    { label: "รหัสวิชา", value: "CP352003" },
                                    { label: "สาขาวิชา", value: "วิทยาการคอมพิวเตอร์" },
                                    { label: "คณะ", value: "วิทยาลัยการคอมพิวเตอร์" },
                                    { label: "มหาวิทยาลัย", value: "มหาวิทยาลัยขอนแก่น" },
                                ].map(item => (
                                    <div key={item.label} className="flex gap-3">
                                        <span className="text-sm text-gray-400 font-medium w-28 shrink-0">{item.label}</span>
                                        <span className="text-sm text-gray-800 font-bold">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
                                <p className="text-xs font-black text-indigo-400 uppercase tracking-wider mb-3">วัตถุประสงค์</p>
                                <ul className="space-y-2.5">
                                    {[
                                        "พัฒนาระบบจัดการสินค้าและสต็อกสำหรับร้านค้า",
                                        "รองรับการขายทั้งออนไลน์และหน้าร้าน",
                                        "ระบบติดตามคำสั่งซื้อและการเงินแบบ Real-time",
                                        "จัดการวัตถุดิบและการผลิตสินค้า",
                                    ].map((t, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</span>
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Advisor */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="p-8">
                        <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full inline-block" />
                            อาจารย์ที่ปรึกษา
                        </h2>
                        <AdvisorCard advisor={ADVISOR} />
                    </div>
                </section>

                {/* Team */}
                <section>
                    <div className="flex items-end justify-between mb-2">
                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full inline-block" />
                            ทีมพัฒนา
                        </h2>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mb-5">* กดที่การ์ดเพื่อดูข้อมูลเพิ่มเติม</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {TEAM.map(member => <MemberCard key={member.id} member={member} />)}
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="p-8">
                        <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full inline-block" />
                            เทคโนโลยีที่ใช้
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {TECH_STACK.map(tech => (
                                <div key={tech.name} className="group bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-md p-4 flex flex-col items-center text-center gap-2 transition-all duration-200">
                                    <span className={`text-xs font-black px-3 py-1.5 rounded-xl ${tech.color}`}>{tech.name}</span>
                                    <p className="text-xs text-gray-400 font-medium">{tech.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                    <div className="p-8">
                        <h2 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-2">
                            <span className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full inline-block" />
                            ขั้นตอนการพัฒนา
                        </h2>
                        <div className="relative">
                            <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400 rounded-full" />
                            <div className="space-y-8">
                                {TIMELINE.map((item, i) => (
                                    <div key={i} className="flex gap-6 pl-14 relative group">
                                        <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-110 transition-transform">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-gray-50 group-hover:bg-indigo-50/50 rounded-2xl p-4 flex-1 transition-colors border border-transparent group-hover:border-indigo-100">
                                            <p className="text-xs font-bold text-indigo-400 mb-1">{item.month}</p>
                                            <p className="font-black text-gray-900 text-sm">{item.title}</p>
                                            <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}