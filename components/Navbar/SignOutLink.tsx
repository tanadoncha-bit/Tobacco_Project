"use client"

import { useClerk } from "@clerk/nextjs"
import { toast } from "sonner"
import { DropdownMenuItem } from "../ui/dropdown-menu"

const SignOutLink = () => {
  const { signOut } = useClerk()

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...", { position: "top-center" })

    // ⏱ delay ก่อน logout
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast.success("Log Out Successfully", {
      id: toastId, position: "top-center",
    })

    await signOut({ redirectUrl: "/user" })
  }

  return (
    <button
      onClick={handleLogout}
      className="cursor-pointer"
    >
      Logout
    </button>
  )
}

export default SignOutLink
