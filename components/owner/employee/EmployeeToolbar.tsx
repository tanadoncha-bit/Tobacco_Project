import React from "react";
import { Bell, Filter } from "lucide-react";
import SearchInput from "@/components/ui/SearchInput";

type Props = {
  total: number;
  search: string;
  onSearchChange: (next: string) => void;
  onAdd: () => void;
  onFilter: () => void;
};

export default function EmployeeToolbar({
  total,
  search,
  onSearchChange,
  onAdd,
  onFilter,
}: Props) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-indigo-900">
          Staff Management
        </h1>

        <div className="flex items-center gap-3">
          <SearchInput value={search} onChange={onSearchChange} />
          <button
            type="button"
            className="rounded-full bg-white/50 p-2 ring-1 ring-black/5 hover:bg-white/70"
            aria-label="notifications"
          >
            <Bell className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="text-4xl font-semibold text-indigo-950">
          {total} Employee
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onFilter}
            className="rounded-2xl bg-white/60 p-3 ring-1 ring-black/5 hover:bg-white/80"
            aria-label="filter"
          >
            <Filter className="h-5 w-5 text-slate-700" />
          </button>

          <button
            type="button"
            onClick={onAdd}
            className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-black/5 hover:bg-white"
          >
            + Add Employee
          </button>
        </div>
      </div>
    </>
  );
}
