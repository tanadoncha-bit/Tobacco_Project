"use client";

import React, { useMemo, useState } from "react";
import EmployeeToolbar from "@/components/owner/employee/EmployeeToolbar";
import EmployeeGrid from "@/components/owner/employee/EmployeeGrid";
import type { Employee } from "@/components/owner/employee/types";
import { useRouter } from "next/navigation";

export default function OwnerEmployeeClient({
  initialEmployees,
}: {
  initialEmployees: Employee[];
}) {
  const [search, setSearch] = useState("");
  const [employees] = useState<Employee[]>(initialEmployees);
  const router = useRouter();

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((e) =>
      [e.name, e.role, e.department, e.email, e.phone]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [employees, search]);

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl">
        <EmployeeToolbar
          total={filteredEmployees.length}
          search={search}
          onSearchChange={setSearch}
          onAdd={() => router.push("/owner/employee/add")}
          onFilter={() => alert("TODO: open filter")}
        />

        <EmployeeGrid
          employees={filteredEmployees}
          onMenuClick={(emp) => alert(`menu: ${emp.name}`)}
        />
      </div>
    </div>
  );
}
