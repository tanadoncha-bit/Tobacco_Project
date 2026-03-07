"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Package, Truck, CheckCircle, X } from "lucide-react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type Notification = {
  id: string
  status: string
  totalAmount: number
  updatedAt: string
  read: boolean
}

const STATUS_INFO: Record<string, { label: string; icon: any; color: string }> = {
  VERIFYING: { label: "รอตรวจสอบสลิป", icon: Package, color: "text-orange-500" },
  PAID: { label: "ชำระเงินแล้ว", icon: CheckCircle, color: "text-blue-500" },
  SHIPPED: { label: "จัดส่งแล้ว", icon: Truck, color: "text-purple-500" },
  COMPLETED: { label: "สำเร็จแล้ว", icon: CheckCircle, color: "text-emerald-500" },
}

const STORAGE_KEY = "notification_last_seen_at"

export default function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState<number>(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setLastSeenAt(parseInt(stored, 10))
  }, [])

  useEffect(() => {
    if (!session) return
    const fetchNotifications = () =>
      fetch("/api/user/notifications")
        .then(r => r.ok ? r.json() : [])
        .then(setNotifications)
        .catch(console.error)

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [session])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const unread = notifications.filter(n => new Date(n.updatedAt).getTime() > lastSeenAt).length

  const handleOpen = () => {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening && notifications.length > 0) {
      const latestTime = Math.max(...notifications.map(n => new Date(n.updatedAt).getTime()))
      setLastSeenAt(latestTime)
      localStorage.setItem(STORAGE_KEY, latestTime.toString())
    }
  }

  if (!session) return null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Bell className="size-5 md:size-6" strokeWidth={2.5} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-gray-900 text-sm">การแจ้งเตือน</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">ยังไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map(n => {
                const info = STATUS_INFO[n.status]
                if (!info) return null
                const Icon = info.icon
                const isNew = new Date(n.updatedAt).getTime() > lastSeenAt
                return (
                  <Link
                    key={n.id}
                    href="/user/OrderStatue"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${isNew ? "bg-purple-50/40" : ""}`}
                  >
                    <div className={`mt-0.5 shrink-0 ${info.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        ออเดอร์ #{n.id.substring(0, 8).toUpperCase()}
                      </p>
                      <p className={`text-xs font-medium mt-0.5 ${info.color}`}>{info.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ฿{n.totalAmount.toLocaleString()} • {new Date(n.updatedAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {isNew && <span className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 shrink-0" />}
                  </Link>
                )
              })
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-100">
            <Link
              href="/user/OrderStatue"
              onClick={() => setIsOpen(false)}
              className="block text-center text-xs font-bold text-purple-600 hover:text-purple-700 transition-colors"
            >
              ดูออเดอร์ทั้งหมด →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}