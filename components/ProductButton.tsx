"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, redirect } from "next/navigation"
import { ShoppingCart, Loader2 } from "lucide-react"

export default function ProductButton({ productId }: { productId: number }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setIsLoading(false)
  }, [pathname])

  const handleClick = () => {
    setIsLoading(true)
    router.push(`/product/${productId}`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full py-2.5 bg-[linear-gradient(160deg,#2E4BB1_0%,#8E63CE_50%,#B07AD9_100%)] hover:opacity-90 text-white rounded-xl font-medium transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> กำลังโหลด...
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" /> ดูรายละเอียด
        </>
      )}
    </button>
  )
}