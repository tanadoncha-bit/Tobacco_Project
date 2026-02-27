"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { TextAlignJustify, User, LayoutDashboard, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const DropdownListMenu = () => {
    // ดึงข้อมูล Session จาก NextAuth
    const { data: session, status } = useSession()

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hover:bg-transparent dark:hover:bg-transparent active:bg-transparent h-10 w-10 p-0 mr-4
                        focus:ring-0 focus:outline-none 
                        focus-visible:ring-0 focus-visible:outline-none ring-0
                        cursor-pointer flex items-center justify-center">
                        {status === "loading" ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                        ) : session ? (
                            session.user.image ? (
                                // สร้างกรอบวงกลมครอบรูป
                                <div className="w-7 h-7 rounded-full overflow-hidden">
                                    <img
                                        src={session.user.image}
                                        alt="Avatar"
                                        className="w-full h-full object-cover" // ให้รูปขยายเต็มกรอบ
                                    />
                                </div>
                            ) : (
                                // ถ้าไม่มีรูป ให้ไอคอน User อยู่ในกรอบวงกลมเหมือนกัน
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                    <User className="h-5 w-5 text-gray-500" />
                                </div>
                            )
                        ) : (
                            <div className="pt-1">
                                <TextAlignJustify strokeWidth={2.5} className="text-white h-7 w-7 size-10" />
                            </div>
                        )}

                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                    {session ? (
                        /* ----------- เมนูสำหรับคนที่ล็อคอินแล้ว ----------- */
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/user/Profile">Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/user/OrderStatue">Order Status</Link>
                            </DropdownMenuItem>

                            {/* ถ้าเป็น ADMIN ให้มีปุ่มไปหลังบ้าน
                            {session.user.role === "ADMIN" && (
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href="/admin">
                                        <span>Admin Management</span>
                                    </Link>
                                </DropdownMenuItem>
                            )} */}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                onClick={() => signOut({ callbackUrl: "/user" })} // กดแล้วเคลียร์ Session และไปหน้า login
                            >
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    ) : (
                        /* ----------- เมนูสำหรับคนที่ยังไม่ล็อคอิน ----------- */
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/login">Login</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/register">Register</Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default DropdownListMenu