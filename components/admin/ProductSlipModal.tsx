"use client"

import { useEffect, useState } from "react"

export default function ProductSlipModal({
  open,
  Pid,
  onClose,
}: {
  open: boolean
  Pid: number | null
  onClose: () => void
}) {
  const [slips, setSlips] = useState<any[]>([])

  useEffect(() => {

    if (!open || !Pid) return

    fetch(`/api/products/slip/${Pid}`)
      .then(res => res.json())
      .then(setSlips)
  }, [open, Pid])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white w-[700px] max-h-[85vh] overflow-y-auto rounded-xl p-6">

        <h2 className="text-xl font-bold mb-4">
          Product Transaction Slip
        </h2>

        {slips.length === 0 && (
          <p className="text-gray-500 text-sm">
            No transaction history
          </p>
        )}

        {slips.map((slip, index) => (
          <div
            key={slip.id}
            className="border rounded-lg p-4 mb-5"
          >
            {/* ===== HEADER ===== */}
            <div className="flex justify-between mb-3">
              <div>
                <p className="font-semibold">
                  Slip #{slip.id}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(slip.createdAt).toLocaleString()}
                </p>
              </div>

              <span
                className={`px-3 py-3 text-xs rounded-lg font-medium
                  ${slip.action === "CREATE"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                  }`}
              >
                {slip.action}
              </span>
            </div>

            {/* ===== META ===== */}
            <div className="text-sm mb-3">
              <p>
                <span className="font-medium">Action by:</span>{" "}
                {slip.createdBy}
              </p>
            </div>

            {/* ===== CONTENT ===== */}
            <div className="bg-gray-50 rounded p-3 text-sm space-y-2">
              <p>
                <span className="font-medium">Product Name:</span>{" "}
                {slip.snapshot?.name}
              </p>

              <p className="font-medium mt-2">Variants</p>

              <table className="w-full text-xs border mt-1">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border px-2 py-1 text-left">
                      Option
                    </th>
                    <th className="border px-2 py-1">
                      Price
                    </th>
                    <th className="border px-2 py-1">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(slip.snapshot?.variants || []).map(
                    (v: any, i: number) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">
                          {Array.isArray(v.combination)
                            ? v.combination.join(" / ")
                            : "-"}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {v.price}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {v.stock}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="text-right mt-4">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
