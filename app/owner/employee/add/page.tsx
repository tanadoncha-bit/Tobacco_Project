"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserRoundPlus, ArrowLeft } from "lucide-react";
import EmployeeForm, {
  type EmployeeFormValues,
} from "@/components/owner/employee/EmployeeForm";

type ApiErrorResponse = { error: string };

function isApiErrorResponse(x: unknown): x is ApiErrorResponse {
  return (
    typeof x === "object" &&
    x !== null &&
    "error" in x &&
    typeof (x as Record<string, unknown>).error === "string"
  );
}

export default function AddEmployeePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: EmployeeFormValues): Promise<void> => {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        if (isApiErrorResponse(data)) throw new Error(data.error);
        throw new Error("Create employee failed");
      }

      // success (ไม่จำเป็นต้องใช้ data ก็ได้)
      router.push("/owner/employee");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    /* <div className="flex min-h-screen items-center justify-center"> */
    <div className="mx-auto max-w-xl p-6 ">
      <button
        type="button"
        onClick={() => router.push("/owner/employee")}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-900 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>
      <h1 className="text-center mb-6 flex items-center justify-center gap-2 text-2xl font-bold text-indigo-900">
        <UserRoundPlus className="h-6 w-6" />
        Add New Employee
      </h1>
      <EmployeeForm
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
    /* </div> */
  );
}
