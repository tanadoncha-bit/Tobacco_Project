import Logo from "./Logo"
import Search from "./Search"
import DropdownListMenu from "./DropdownListMenu"
import CartButton from "../user/CartButton"
import NotificationBell from "./NotificationBell"


const Navbar = () => {
  return (
    <nav className="w-full bg-gradient-to-r from-[#2E4BB1] via-[#8E63CE] to-[#B07AD9] text-white sticky top-0 z-40 shadow-lg shadow-purple-900/20">
      <div className="container mx-auto flex items-center justify-between px-4 py-3 md:py-4">
        <Logo />
        <div className="hidden md:flex flex-1 mx-6">
          <Search />
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <CartButton />
          <DropdownListMenu />
        </div>
      </div>
      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <Search />
      </div>
    </nav>
  )
}
export default Navbar