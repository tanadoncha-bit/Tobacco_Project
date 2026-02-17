"use client"

import { ImagePlus } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import ConfirmDeleteModal from "./ConfirmDeleteModal"

type StockItem = {
  productCode: string
  name: string
  stock: number
}

export default function EditProductModal({
  open,
  stockItem,
  onClose,
  onSuccess,
}: {
  open: boolean
  stockItem: StockItem | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [product, setProduct] = useState<any>(null)
  const [name, setName] = useState("")
  const [variants, setVariants] = useState<any[]>([])
  const [images, setImages] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ================= FETCH =================
  useEffect(() => {
    if (!open || !stockItem) return

    const fetchProduct = async () => {
      const res = await fetch(`/api/products/get/${stockItem.productCode}`)
      const data = await res.json()

      setProduct(data)
      setName(data.Pname)

      // เพิ่ม clientId ให้ทุก variant (แก้ปัญหา key ไม่ stable)
      setVariants(
        (data.variants || []).map((v: any) => ({
          ...v,
          clientId: crypto.randomUUID(),
        }))
      )

      setImages(data.images?.map((i: any) => i.url) || [])
    }

    fetchProduct()
  }, [open, stockItem])

  if (!open || !product) return null

  // ================= SAVE =================
  const handleSave = async () => {
    const cleanVariants = variants.map((v) => ({
      id: v.id,
      price: v.price,
      stock: v.stock,
      values: v.values.map((val: any) => ({
        optionValueId: val.optionValueId,
        optionId: val.optionId,
        optionValue: val.optionValue,
      })),
    }))

    await fetch("/api/products/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Pid: product.Pid,
        name,
        images,
        variants: cleanVariants,
      }),
    })

    onSuccess()
    onClose()
  }


  // ================= DELETE PRODUCT =================
  const handleDelete = async () => {
    await fetch("/api/products/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Pid: product.Pid }),
    })

    onSuccess()
    onClose()
  }

  // ================= IMAGE =================
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // ================= VARIANT UPDATE =================
  const updateVariant = (clientId: string, field: string, value: any) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.clientId === clientId ? { ...v, [field]: value } : v
      )
    )
  }

  const updateVariantValue = (
    clientId: string,
    index: number,
    newValue: string
  ) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.clientId === clientId
          ? {
            ...v,
            values: v.values.map((val: any, i: number) =>
              i === index
                ? {
                  ...val,
                  optionValue: {
                    ...val.optionValue,
                    value: newValue,
                  },
                }
                : val
            ),
          }
          : v
      )
    )
  }

  const addVariant = () => {
    const option = product.Option[0] // สมมติ 1 option ก่อน

    setVariants((prev) => [
      ...prev,
      {
        id: null,
        clientId: crypto.randomUUID(),
        price: 0,
        stock: 0,
        values: [
          {
            optionId: option.id, // ⭐ ต้องมี
            optionValueId: null, // ใหม่ = null
            optionValue: { value: "" },
          },
        ],
      },
    ])
  }


  const removeVariant = (clientId: string) => {
    setVariants((prev) =>
      prev.filter((v) => v.clientId !== clientId)
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[750px] max-h-[90vh] overflow-y-auto rounded-xl p-6 space-y-6">
        <h2 className="text-xl font-bold">Edit Product</h2>

        {/* ================= IMAGES ================= */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Images
          </label>

          <div className="flex gap-3 flex-wrap">
            {images.map((url, index) => (
              <div
                key={index}
                className="relative w-24 h-24 border rounded-md overflow-hidden group"
              >
                <img
                  src={url}
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer"
            >
              <ImagePlus className="w-6 h-6 mb-1" />
              <span className="text-xs">เพิ่มรูป</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                if (!e.target.files?.[0]) return
                const file = e.target.files[0]

                const formData = new FormData()
                formData.append("file", file)

                const res = await fetch("/api/upload", {
                  method: "POST",
                  body: formData,
                })

                const data = await res.json()
                if (data.url) {
                  setImages((prev) => [...prev, data.url])
                }
              }}
            />
          </div>
        </div>

        {/* ================= NAME ================= */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Name
          </label>
          <input
            className="w-full border px-3 py-2 rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* ================= VARIANTS ================= */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Variants
          </label>

          <div className="space-y-3">
            {variants.map((v) => {
              const optionValue =
                v.values?.[0]?.optionValue?.value ?? ""

              return (
                <div
                  key={v.clientId}
                  className="flex items-center gap-3 border p-3 rounded-md"
                >
                  <input
                    value={optionValue}
                    onChange={(e) =>
                      updateVariantValue(
                        v.clientId,
                        0,
                        e.target.value
                      )
                    }
                    className="flex-1 border px-3 py-2 rounded-md"
                    placeholder="Option Value"
                  />

                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) =>
                      updateVariant(
                        v.clientId,
                        "price",
                        Number(e.target.value)
                      )
                    }
                    className="w-28 border px-2 py-1 rounded"
                    placeholder="Price"
                  />

                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) =>
                      updateVariant(
                        v.clientId,
                        "stock",
                        Number(e.target.value)
                      )
                    }
                    className="w-24 border px-2 py-1 rounded"
                    placeholder="Stock"
                  />

                  <button
                    onClick={() =>
                      removeVariant(v.clientId)
                    }
                    className="ml-auto text-red-500 text-sm cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>

          <button
            onClick={addVariant}
            className="mt-3 text-purple-600 text-sm cursor-pointer"
          >
            + Add Variant
          </button>
        </div>

        {/* ================= BUTTONS ================= */}
        <div className="flex justify-between pt-4 border-t">
          <button
            onClick={() => setConfirmDelete(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm cursor-pointer"
          >
            Delete
          </button>


          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await handleDelete()
          setConfirmDelete(false)
        }}
      />
      
    </div>
  )
}
