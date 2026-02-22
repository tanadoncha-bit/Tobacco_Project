import React from "react";
import EmployeeCard from "./EmployeeCard";
import type { Employee } from "./types";

type Props = {
  employees: Employee[];
  onMenuClick?: (employee: Employee) => void;
};

export default function EmployeeGrid({ employees, onMenuClick }: Props) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {employees.map((emp) => (
        <EmployeeCard key={emp.id} employee={emp} onMenuClick={onMenuClick} />
      ))}
    </div>
  );
}
