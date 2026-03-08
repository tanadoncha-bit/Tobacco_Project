import Link from "next/link"
import { Button } from "../ui/button"
import { prisma } from "@/utils/db"

const Logo = async () => {

    const settings = await prisma.storeSetting.findUnique({
        where: { id: "global" }
    })

    const storeName = settings?.storeName || "Tobacco Store"

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
        text-2xl md:text-3xl
        font-semibold 
        tracking-wide
        leading-none">
            <Link href={'/user'} className="text-2xl">
                {storeName}
            </Link>
        </Button>
    )
}
export default Logo