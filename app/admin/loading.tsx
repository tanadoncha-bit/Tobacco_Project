import { Loader2 } from "lucide-react"

export default function GlobalLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4 w-full">
      <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      <p className="text-gray-500 font-medium animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
    </div>
  )
}