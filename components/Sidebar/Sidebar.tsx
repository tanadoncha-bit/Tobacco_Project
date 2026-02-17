"use client"

import {
  LayoutGrid,
  Store,
  Warehouse,
  Archive,
} from "lucide-react"
import { usePathname } from "next/navigation"
import clsx from "clsx"
import Link from "next/link"
import { UserAvatar } from "@clerk/nextjs"

const menu = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutGrid,
  },
  {
    label: "Sale Item",
    href: "/admin/SaleItem",
    icon: Store,
  },
  {
    label: "Stock",
    href: "/admin/Stock",
    icon: Warehouse,
  },
  {
    label: "Material",
    href: "/admin/Material",
    icon: Archive,
  },
]

const Sidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-screen bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] text-white flex flex-col justify-between px-6 py-8 rounded-4xl">
      <div>
        <h1 className=" text-3xl font-bold mb-12 text-center tracking-wide">Tobacco</h1>
        <nav className="space-y-2">
          {menu.map((item) => {
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
                  active
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                )}
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Profile */}
      <div className="flex items-center gap-3">
        <div className="mr-3 ml-3">
          <UserAvatar appearance={{ elements: { avatarBox: "scale-150" } }} />
        </div>
        <div>
          <p className="text-sm font-medium">Pawarisa</p>
          <p className="text-xs text-white/70">
            Product Staff
          </p>
        </div>
      </div>
    </aside>
  )
}
export default Sidebar