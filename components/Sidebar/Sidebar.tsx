"use client"

import { useState, useEffect, useRef } from "react"
import {
  LayoutGrid,
  Wallet,
  Store,
  Warehouse,
  Archive,
  Users,
  Settings2,
  LogOut,
  ClipboardClock,
  UserCircle
} from "lucide-react"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

const menu = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutGrid,
    roles: ["ADMIN", "STAFF", "MANAGER"]
  },
  {
    label: "Financial",
    href: "/admin/Financial",
    icon: Wallet,
    roles: ["ADMIN", "MANAGER"]
  },
  {
    label: "History",
    href: "/admin/history",
    icon: ClipboardClock,
    roles: ["ADMIN", "MANAGER"]
  },
  {
    label: "Order Management",
    href: "/admin/SaleItem",
    icon: Store,
    roles: ["ADMIN", "STAFF", "MANAGER"]
  },
  {
    label: "Stock",
    href: "/admin/Stock",
    icon: Warehouse,
    roles: ["ADMIN", "STAFF", "MANAGER"]
  },
  {
    label: "Material",
    href: "/admin/Material",
    icon: Archive,
    roles: ["ADMIN", "STAFF", "MANAGER"]
  },
  {
    label: "Employee",
    href: "/admin/employees",
    icon: Users,
    roles: ["ADMIN"]
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings2,
    roles: ["ADMIN"]
  },
]

const Sidebar = () => {
  const pathname = usePathname()
  const { data: session } = useSession()

  const [storeName, setStoreName] = useState("Tobacco Store")

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  const userRole = session?.user?.role ?? ""

  useEffect(() => {
    const fetchStoreName = async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          if (data.storeName) setStoreName(data.storeName)
        }
      } catch (error) {
        console.error("ดึงข้อมูลชื่อร้านล้มเหลว", error)
      }
    }
    fetchStoreName()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <aside className="w-64 h-screen bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] text-white flex flex-col justify-between px-6 py-8 rounded-4xl">
      <div>
        <h1 className="text-3xl font-bold mb-12 text-center tracking-wide">{storeName}</h1>
        <nav className="space-y-2">
          {menu
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const Icon = item.icon
              const active = item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-2 rounded-lg transition",
                    active ? "bg-white/20" : "hover:bg-white/10"
                  )}
                >
                  <Icon size={18} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
        </nav>
      </div>

      {session && (
        <div className="relative" ref={profileRef}>

          {/* เมนู Pop-up (เด้งขึ้นด้านบน เพราะอยู่ขอบล่างจอ) */}
          {isProfileOpen && (
            <div className="absolute bottom-[110%] left-0 w-full bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="py-2">
                <Link
                  href="/admin/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm font-medium hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                  <UserCircle size={18} className="mr-3" />
                  My Profile
                </Link>
                <div className="h-px bg-gray-100 my-1"></div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={18} className="mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* ปุ่มโปรไฟล์เดิม (เปลี่ยนเป็นปุ่มคลิกได้) */}
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users size={20} className="text-white" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-white/70 truncate">
                {session.user.role || "Admin"}
              </p>
            </div>
          </div>

        </div>
      )}
    </aside>
  )
}

export default Sidebar