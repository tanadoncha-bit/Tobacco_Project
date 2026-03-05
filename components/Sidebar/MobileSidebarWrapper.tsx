"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import Sidebar from "./Sidebar"

export default function MobileSidebarWrapper() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // ปิด sidebar เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg shadow-purple-200 cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar drawer */}
      <div className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>
    </div>
  )
}