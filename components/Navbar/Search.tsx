"use client" 

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Input } from "../ui/input"
import { Search as SearchIcon } from "lucide-react"

const Search = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const pathname = usePathname()
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchTerm.trim()) {
      router.push(`${pathname}?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      router.push(pathname)
    }
  }

  return (
    <form 
      onSubmit={handleSearch} 
      className="flex-1 relative w-full max-w-6xl flex justify-center"
    >
      <Input 
        type="text" 
        placeholder="ค้นหาสินค้า" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-white text-black rounded-full dark:bg-white pr-12"
      />
      
      <button 
        type="submit" 
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-800 transition-colors cursor-pointer"
        aria-label="ค้นหา"
      >
        <SearchIcon className="w-5 h-5" />
      </button>
    </form>
  )
}

export default Search