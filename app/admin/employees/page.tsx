import prisma from "@/utils/db"
import EmployeeManagementClient from "./EmployeeManagementClient"

export const revalidate = 60

export default async function EmployeeManagementPage() {
  const employees = await prisma.profile.findMany({
    where: { role: { not: "USER" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, firstname: true, lastname: true,
      email: true, role: true, profileImage: true,
    },
  })

  const totalEmployees = employees.length
  const admins         = employees.filter(e => e.role === "ADMIN").length
  const managers       = employees.filter(e => e.role === "MANAGER").length
  const staff          = employees.filter(e => e.role === "STAFF").length

  return (
    <EmployeeManagementClient
      initialEmployees={employees}
      stats={{ totalEmployees, admins, managers, staff }}
    />
  )
}