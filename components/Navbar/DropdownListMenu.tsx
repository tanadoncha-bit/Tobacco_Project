import { TextAlignJustify, CircleUser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SignIn, SignOutButton, UserAvatar } from '@clerk/nextjs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import SignOutLink from "./SignOutLink"
import { SignedIn, SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs'


const DropdownListMenu = () => {
    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="
                    hover:bg-transparent 
                    dark:hover:bg-transparent
                    active:bg-transparent 
                    h-10 w-8 p-2 mr-20
                    focus:ring-0 
                    focus:outline-none 
                    focus-visible:ring-0
                    focus-visible:outline-none ring-0
                    cursor-pointer">
                        <SignedOut>
                            <TextAlignJustify strokeWidth={2.5} />
                        </SignedOut>
                        <SignedIn >
                            <UserAvatar
                                appearance={{
                                    elements: {
                                        avatarBox: "h-1 w-1 scale-70",
                                    },
                                }}
                            />
                        </SignedIn>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <SignedOut>
                            <DropdownMenuItem className="cursor-pointer">
                                <SignInButton mode="modal">
                                    <button className="cursor-pointer">
                                        Login
                                    </button>
                                </SignInButton>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <SignUpButton mode="modal">
                                    <button className="cursor-pointer">
                                        Register
                                    </button>
                                </SignUpButton>
                            </DropdownMenuItem>
                        </SignedOut>
                        <SignedIn>
                            <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">Order Status</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                                <SignOutLink />
                            </DropdownMenuItem>
                        </SignedIn>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

    )
}
export default DropdownListMenu