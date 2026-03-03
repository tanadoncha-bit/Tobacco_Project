"use client"

import { useState, useEffect, useRef } from "react"
import {
  LayoutGrid, Store, Warehouse, Users, Settings2,
  LogOut, UserCircle, Factory, ChevronLeft, ChevronRight,
  FlaskConical, ClipboardList, History, BarChart3,
} from "lucide-react"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

type BadgeCounts = {
  pendingOrders: number
  nearExpiry: number
}

const menu = [
  { label: "Dashboard", href: "/admin", icon: LayoutGrid, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { label: "Order Management", href: "/admin/SaleItem", icon: Store, roles: ["ADMIN", "MANAGER", "STAFF"], badgeKey: "pendingOrders" as keyof BadgeCounts },
  { label: "Material", href: "/admin/Material", icon: FlaskConical, roles: ["ADMIN", "MANAGER", "STAFF"], badgeKey: "nearExpiry" as keyof BadgeCounts },
  { label: "Productions", href: "/admin/productions", icon: Factory, roles: ["ADMIN", "MANAGER"] },
  { label: "Stock", href: "/admin/Stock", icon: Warehouse, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { label: "Reports", href: "/admin/reports/defects", icon: ClipboardList, roles: ["ADMIN", "MANAGER", "STAFF"] },
  { label: "History", href: "/admin/history", icon: History, roles: ["ADMIN", "MANAGER"] },
  { label: "Financial", href: "/admin/Financial", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { label: "Employee", href: "/admin/employees", icon: Users, roles: ["ADMIN"] },
  { label: "Settings", href: "/admin/settings", icon: Settings2, roles: ["ADMIN"] },
]

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-rose-500 text-rose-100",
  MANAGER: "bg-blue-500 text-blue-100",
  STAFF: "bg-emerald-500 text-emerald-100",
}

const Sidebar = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role ?? ""

  const [storeName, setStoreName] = useState("Tobacco")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [badges, setBadges] = useState<BadgeCounts>({ pendingOrders: 0, nearExpiry: 0 })
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session) return

    const fetchSidebar = () =>
      fetch("/api/admin/sidebar")
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (!d) return
          setStoreName(d.storeName)
          setBadges({ pendingOrders: d.pendingOrders, nearExpiry: d.nearExpiry })
        })
        .catch(console.error)

    fetchSidebar()
    const interval = setInterval(fetchSidebar, 60_000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setIsProfileOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <aside className={clsx(
      "h-screen bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] text-white flex flex-col justify-between py-8 rounded-4xl transition-all duration-300",
      collapsed ? "w-20 px-3" : "w-64 px-6"
    )}>
      <div>

        {/* Store name */}
        <div className="relative flex items-center justify-center mb-10">
          {!collapsed && (
            <h1 className="text-2xl font-black tracking-tight truncate">{storeName}</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={clsx(
              "absolute right-0 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer",
              collapsed && "static mx-auto"
            )}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {menu
            .filter(item => item.roles.includes(userRole))
            .map(item => {
              const Icon = item.icon
              const active = item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
              const count = item.badgeKey ? badges[item.badgeKey] : 0

              return (
                <div key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150",
                      collapsed && "justify-center",
                      active ? "bg-white/20 font-bold shadow-sm" : "hover:bg-white/10 font-medium"
                    )}
                  >
                    {/* Icon + badge dot (collapsed only) */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <Icon className="w-[18px] h-[18px]" />
                      {count > 0 && collapsed && (
                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    {!collapsed && (
                      <span className="text-sm truncate flex-1">{item.label}</span>
                    )}

                    {/* Count pill (expanded only) */}
                    {!collapsed && count > 0 && (
                      <span className="ml-auto bg-rose-500/80 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg leading-none">
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </Link>

                  {/* Tooltip (collapsed only) */}
                  {collapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900/90 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 shadow-xl flex items-center gap-2">
                      {item.label}
                      {count > 0 && (
                        <span className="w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900/90" />
                    </div>
                  )}
                </div>
              )
            })}
        </nav>
      </div>

      {/* Profile */}
      {session && (
        <div className="relative" ref={profileRef}>
          {isProfileOpen && (
            <div className="absolute bottom-[110%] left-0 w-52 bg-white text-gray-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="py-2">
                <Link
                  href="/admin/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm font-bold hover:bg-purple-50 hover:text-purple-700 transition-colors"
                >
                  <UserCircle className="w-4 h-4 mr-3" /> My Profile
                </Link>
                <div className="h-px bg-gray-100 my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/user" })}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-3" /> Logout
                </button>
              </div>
            </div>
          )}

          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={clsx(
              "flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer",
              collapsed && "justify-center"
            )}
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
              {session.user.image
                ? <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
                : <Users className="w-5 h-5 text-white" />
              }
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-tight">{session.user.name}</p>
                <span className={clsx(
                  "inline-block mt-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase",
                  ROLE_BADGE[userRole] ?? "bg-white/20 text-white/80"
                )}>
                  {userRole}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

export default Sidebar