import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"

export default async function Home() {
  
  const session = await getServerSession(authOptions)
  const userRole = session?.user?.role
  const basicAdminRoles = ["ADMIN", "STAFF", "MANAGER"]

  if (userRole && basicAdminRoles.includes(userRole)) {
    redirect("/admin")
  }
  
  redirect("/user")
}