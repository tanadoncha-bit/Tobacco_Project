"use client"

import { usePathname } from "next/navigation"

export default function ConditionalNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null
  }

  return <>{children}</>
}