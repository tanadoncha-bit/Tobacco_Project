"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import AddProductModal from "./AddProductModal"
import SearchAndSortBar from "./SearchAndSortBar"
import EditProductModal from "./EditProductModal"

type StockItem = {
  productCode: string
  name: string
  stock: number
  imageUrl?: string
}

export default function StockTable({
  data,
}: {
  data: StockItem[]
}) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] =
    useState<StockItem | null>(null)

  const [sort, setSort] = useState<
    | "newest"
    | "oldest"
    | "stock-high"
    | "stock-low"
    | "name-az"
    | "name-za"
  >("newest")

  const router = useRouter()

  const filteredAndSorted = useMemo(() => {
    let result = [...data]

    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.productCode.toLowerCase().includes(search.toLowerCase())
    )

    switch (sort) {
      case "stock-high":
        result.sort((a, b) => b.stock - a.stock)
        break
      case "stock-low":
        result.sort((a, b) => a.stock - b.stock)
        break
      case "name-az":
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-za":
        result.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "oldest":
        result.reverse()
        break
    }

    return result
  }, [data, search, sort])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Check Stock Status
        </h1>
      </div>

      {/* Search + Sort + Add */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <SearchAndSortBar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
        />

        <button
          onClick={() => setOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-md text-sm font-semibold transition cursor-pointer"
        >
          + Add Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left">
              <th className="px-6 py-3 font-semibold">Product</th> 
              <th className="px-6 py-3 font-semibold">Product Code</th>
              <th className="px-6 py-3 font-semibold">Product name</th>
              <th className="px-6 py-3 font-semibold">In stock</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>

          <tbody>
            {filteredAndSorted.map((item) => (
              <tr
                key={item.productCode}
                className="border-b last:border-none hover:bg-gray-50 transition"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {/* Image */}
                    <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-gray-600">
                  {item.productCode}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-gray-700 font-medium">
                  {item.stock}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setSelected(item)
                      setEditOpen(true)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-xs font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredAndSorted.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-6 text-center text-gray-400"
                >
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <EditProductModal
        open={editOpen}
        stockItem={selected}
        onClose={() => {
          setEditOpen(false)
          setSelected(null)
        }}
        onSuccess={() => router.refresh()}
      />

      <AddProductModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}


