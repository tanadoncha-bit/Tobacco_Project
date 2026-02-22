import React from "react";
import { Mail, Phone, MoreHorizontal, User } from "lucide-react";
import type { Employee } from "./types";

type Props = {
  employee: Employee;
  onMenuClick?: (employee: Employee) => void;
};

export default function EmployeeCard({ employee, onMenuClick }: Props) {
  return (
    <div className="rounded-3xl bg-white/60 p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between">
        <div className="h-12 w-12 rounded-full bg-slate-800/80 flex items-center justify-center">
          <User className="h-6 w-6 text-white" />
        </div>

        <button
          type="button"
          onClick={() => onMenuClick?.(employee)}
          className="rounded-xl p-2 hover:bg-black/5"
          aria-label="employee menu"
        >
          <MoreHorizontal className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      <div className="mt-3">
        <div className="text-slate-900 font-semibold">{employee.name}</div>
        <div className="text-slate-500 text-sm">{employee.role}</div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-3 ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-[11px] text-slate-500">Department</div>
            <div className="text-sm font-semibold text-slate-800">
              {employee.department}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-slate-500">Hire Date</div>
            <div className="text-sm font-semibold text-slate-800">
              {employee.hireDate}
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Phone className="h-4 w-4" />
            <span className="text-sm">{employee.phone}</span>
          </div>
        </div>
      </div>
    </div>
  );
}