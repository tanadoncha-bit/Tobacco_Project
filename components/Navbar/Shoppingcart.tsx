import { ShoppingCart } from "lucide-react"
import { Button } from "../ui/button"
import Link from "next/link"

const shoppingcart = () => {
  return (
    <div>
      <Button variant="ghost" className="dark:hover:bg-transparent hover:bg-transparent hover:text-white active:bg-transparent focus:bg-transparent h-12 w-12 mr-20 ">
        <Link href={'/user/ShoppingCart'}>
          <ShoppingCart className="size-8" strokeWidth={2.5} />
        </Link>
      </Button>
    </div>
  )
}
export default shoppingcart