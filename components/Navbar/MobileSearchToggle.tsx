"use client"

import { useState } from "react"
import { Search as SearchIcon, X } from "lucide-react"
import Search from "./Search"

const MobileSearchToggle = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
      </button>

      {open && (
        <div className="md:hidden absolute top-full left-0 w-full px-4 pb-3 pt-2 bg-gradient-to-r from-[#2E4BB1] via-[#8E63CE] to-[#B07AD9] animate-in fade-in slide-in-from-top-1 duration-200">
          <Search autoFocus />
        </div>
      )}
    </>
  )
}

export default MobileSearchToggle
