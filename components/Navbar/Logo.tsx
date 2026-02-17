import Link from "next/link"
import { Button } from "../ui/button"

const Logo = () => {
    return (
        <Button size={'sm'} asChild variant="ghost" className="text-white 
        dark:hover:bg-transparent
        dark:hover:text-white
        hover:bg-transparent
        hover:text-white
        active:bg-transparent
        active:text-white
        focus:bg-transparent
        focus:text-white
        focus-visible:ring-0
        focus-visible:outline-none
        text-3xl 
        font-semibold 
        tracking-wide
        leading-none">
            <Link href={'/user'} className="text-2xl">
                Tobacco
            </Link>
        </Button>
    )
}
export default Logo