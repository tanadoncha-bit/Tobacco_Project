"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortOption =
  | "newest"
  | "oldest"
  | "stock-high"
  | "stock-low"
  | "name-az"
  | "name-za"

export default function SearchAndSortBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: {
  search: string
  onSearchChange: (value: string) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Search */}
      <input
        type="text"
        placeholder="Search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-72 px-3 py-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-purple-400 bg-white"
      />

      {/* Sort (shadcn) */}
      <Select
        value={sort}
        onValueChange={(value) =>
          onSortChange(value as SortOption)
        }
      >
        <SelectTrigger className="w-[200px] cursor-pointer bg-white">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="newest" className="cursor-pointer">
            Newest
          </SelectItem>
          <SelectItem value="oldest" className="cursor-pointer">
            Oldest
          </SelectItem>
          <SelectItem value="stock-high" className="cursor-pointer">
            Stock: High → Low
          </SelectItem>
          <SelectItem value="stock-low" className="cursor-pointer">
            Stock: Low → High
          </SelectItem>
          <SelectItem value="name-az" className="cursor-pointer">
            Name: A → Z
          </SelectItem>
          <SelectItem value="name-za" className="cursor-pointer">
            Name: Z → A
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
