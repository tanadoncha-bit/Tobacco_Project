import Logo from "./Logo"
import Search from "./Search"
import Darkmode from "./Darkmode"
import DropdownListMenu from "./DropdownListMenu"
import ShoppingCart from "./Shoppingcart"

const Navbar = () => {
    return (
        <nav className="w-full bg-gradient-to-r from-[#2E4BB1] via-[#8E63CE] to-[#B07AD9] text-white">
            <div className="container mx-auto flex justify-end items-center pt-2">
                <Darkmode />
                <DropdownListMenu />
            </div>
            <div className="container mx-auto flex items-center justify-between pb-3">
                <Logo />
                <Search />
                <ShoppingCart />
            </div>
        </nav>
    )
}
export default Navbar