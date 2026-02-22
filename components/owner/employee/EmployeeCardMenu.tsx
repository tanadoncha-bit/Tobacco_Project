"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import type { Employee } from "@/components/owner/employee/types";

type Props = {
  employee: Employee;
  onView?: (emp: Employee) => void;
  onEdit?: (emp: Employee) => void;
  onDelete?: (emp: Employee) => void;
};

export default function EmployeeCardMenu({ employee, onView, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg p-2 hover:bg-black/5"
        aria-label="employee menu"
      >
        <MoreHorizontal className="h-5 w-5 text-slate-700" />
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-20 w-40 rounded-xl bg-white p-1 shadow-lg ring-1 ring-black/10">
          <MenuItem
            icon={<Eye className="h-4 w-4" />}
            label="View"
            onClick={() => {
              setOpen(false);
              onView?.(employee);
            }}
          />
          <MenuItem
            icon={<Pencil className="h-4 w-4" />}
            label="Edit"
            onClick={() => {
              setOpen(false);
              onEdit?.(employee);
            }}
          />
          <MenuItem
            icon={<Trash2 className="h-4 w-4 text-red-600" />}
            label="Delete"
            danger
            onClick={() => {
              setOpen(false);
              onDelete?.(employee);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
        danger ? "text-red-700 hover:bg-red-50" : "text-slate-800 hover:bg-slate-50",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}