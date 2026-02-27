import Logo from "./Logo"
import Search from "./Search"
import DropdownListMenu from "./DropdownListMenu"
import CartButton from "../user/CartButton"

const Navbar = () => {
    return (
        <nav className="w-full bg-gradient-to-r from-[#2E4BB1] via-[#8E63CE] to-[#B07AD9] text-white">
            <div className="container mx-auto flex items-center justify-between pb-3 pt-6">
                <Logo />
                <Search />
                <div className="flex items-center gap-4">
                    <CartButton />
                    <DropdownListMenu />
                </div>
            </div>

        </nav>
    )
}
export default Navbar
