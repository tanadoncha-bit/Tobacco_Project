import Logo from "./Logo"
import Search from "./Search"
import DropdownListMenu from "./DropdownListMenu"
import CartButton from "./CartButton"
import NotificationBell from "./NotificationBell"
import MobileSearchToggle from "./MobileSearchToggle"

// Server Component — ไม่มี "use client" ทำให้ Logo (async) ทำงานได้ปกติ
const Navbar = () => {
  return (
    <nav className="w-full bg-gradient-to-r from-[#2E4BB1] via-[#8E63CE] to-[#B07AD9] text-white sticky top-0 z-40 shadow-lg shadow-purple-900/20">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4 relative">

        <div className="shrink-0">
          <Logo />
        </div>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-7xl mx-6">
          <Search />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Mobile search toggle — client component แยกออกมา */}
          <MobileSearchToggle />
          <NotificationBell />
          <CartButton />
          <DropdownListMenu />
        </div>

      </div>
    </nav>
  )
}

export default Navbar