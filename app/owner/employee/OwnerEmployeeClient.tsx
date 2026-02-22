"use client";

import React, { useMemo, useState } from "react";
import EmployeeToolbar from "@/components/owner/employee/EmployeeToolbar";
import EmployeeGrid from "@/components/owner/employee/EmployeeGrid";
import type { Employee } from "@/components/owner/employee/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";

export default function OwnerEmployeeClient({
  initialEmployees,
}: {
  initialEmployees: Employee[];
}) {
  const [search, setSearch] = useState("");
  const [employees] = useState<Employee[]>(initialEmployees);
  const router = useRouter();

  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [target, setTarget] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.role, e.department, e.email, e.phone]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [employees, search]);

  const openDelete = (emp: Employee) => {
    setTarget(emp);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!target) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employee/${target.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");

      setDeleteOpen(false);
      setTarget(null);

      router.refresh(); // ให้ server page ดึง DB ใหม่
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

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
          onView={(emp) => router.push(`/owner/employee/${emp.id}`)}
          onEdit={(emp) => router.push(`/owner/employee/${emp.id}/edit`)}
          onDelete={openDelete}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete employee?"
        description={
          target ? `This will permanently delete ${target.name}.` : undefined
        }
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
