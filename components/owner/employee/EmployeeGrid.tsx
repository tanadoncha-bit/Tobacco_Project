import React from "react";
import EmployeeCard from "./EmployeeCard";
import type { Employee } from "./types";

type Props = {
  employees: Employee[];
  onView?: (employee: Employee) => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
};

export default function EmployeeGrid({ employees, onView, onEdit, onDelete }: Props) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((emp) => (
        <EmployeeCard
          key={emp.id}
          employee={emp}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}