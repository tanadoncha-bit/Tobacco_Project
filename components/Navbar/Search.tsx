"use client" // 🚀 1. ต้องมีตัวนี้เพราะมีการใช้ State และ Router

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "../ui/input"
import { Search as SearchIcon } from "lucide-react" // 🚀 นำเข้าไอคอนแว่นขยาย

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  // ฟังก์ชันนี้จะทำงานเมื่อลูกค้ากดปุ่ม Enter หรือคลิกไอคอนแว่นขยาย
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault() // ป้องกันไม่ให้หน้าเว็บรีเฟรชกระตุก
    
    if (searchTerm.trim()) {
      // โยนคำค้นหาใส่ URL (ผลลัพธ์: /user?search=คำที่พิมพ์)
      router.push(`${pathname}?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      // ถ้าไม่ได้พิมพ์อะไรแล้วกดค้นหา ให้เคลียร์ URL กลับเป็นหน้าปกติ
      router.push(pathname)
    }
  }

  return (
    // 🚀 2. ใช้ <form> ครอบ เพื่อให้รองรับการกดปุ่ม Enter
    <form 
      onSubmit={handleSearch} 
      className="flex-1 relative w-full max-w-6xl flex justify-center"
    >
      <Input 
        type="text" 
        placeholder="ค้นหาสินค้า" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // 🚀 เก็บค่าที่ลูกค้าพิมพ์
        // เพิ่ม pr-12 (padding-right) เพื่อเว้นที่ว่างด้านขวาไว้ใส่ปุ่ม จะได้ไม่พิมพ์ทับปุ่มครับ
        className="w-full bg-white text-black rounded-full dark:bg-white pr-12"
      />
      
      {/* 🚀 3. ปุ่มแว่นขยาย (วางไว้มุมขวาในกล่อง Input) */}
      <button 
        type="submit" 
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2E4BB1] transition-colors cursor-pointer"
        aria-label="ค้นหา"
      >
        <SearchIcon className="w-5 h-5" />
      </button>
    </form>
  )
}

export default Search