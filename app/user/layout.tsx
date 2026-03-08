import prisma from "@/utils/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/authOptions"
import { redirect } from "next/navigation"

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const settings = await prisma.storeSetting.findUnique({
    where: { id: "global" }
  })

  if (settings?.maintenanceMode) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role === "USER") {
      redirect("/maintenance")
    }
  }

  return (
    <div>
      {children} 
    </div>
  )
}