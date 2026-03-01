import prisma from "@/utils/db"
import EmployeeManagementClient from "./EmployeeManagementClient"

export const dynamic = "force-dynamic";

export default async function EmployeeManagementPage() {
  
  const employees = await prisma.profile.findMany({
    where: {
      role: { not: "USER" } 
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      email: true,
      role: true,
      profileImage: true,
    }
  })

  return <EmployeeManagementClient initialEmployees={employees} />
}