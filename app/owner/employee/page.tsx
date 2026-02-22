export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import OwnerEmployeeClient from "./OwnerEmployeeClient";

export default async function OwnerEmployeePage() {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
  });

  // map ให้ตรงกับ type ที่ UI ใช้อยู่ตอนนี้
  const uiEmployees = employees.map((e) => ({
    id: e.id,
    name: `${e.firstname} ${e.lastname}`,
    role: e.position,          // ใช้ position แทน role
    department: "-",           // คุณยังไม่มี field department ใน DB
    hireDate: e.createdAt.toISOString().slice(0, 10),
    email: e.email,
    phone: e.tel,
  }));

  return <OwnerEmployeeClient initialEmployees={uiEmployees} />;
}
