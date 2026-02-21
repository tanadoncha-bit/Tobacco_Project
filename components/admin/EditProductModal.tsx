"use client"

import { ImagePlus, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import ConfirmDeleteModal from "./ConfirmDeleteModal"

type StockItem = {
  productCode: string
  name: string
  stock: number
}

type Variant = {
  key: string
  combination: string[]
  price: number
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
  const [variants, setVariants] = useState<Variant[]>([])
  const [images, setImages] = useState<string[]>([])
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ================= FETCH =================

  useEffect(() => {
    if (!product?.Option) return
    regenerateVariants(product.Option)
  }, [product?.Option])


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
          key: v.values.map((val: any) => val.optionValue.value).join("|"),
          combination: v.values.map((val: any) => val.optionValue.value),
          price: v.price ?? 0,
          stock: v.stock ?? 0,
        }))
      )



      setImages(data.images?.map((i: any) => i.url) || [])
    }

    fetchProduct()
  }, [open, stockItem])

  if (!open || !product) return null


  const regenerateVariants = (options: any[]) => {
    if (!options?.length) {
      setVariants([])
      return
    }

    const cartesian = (arr: any[][]): any[][] =>
      arr.reduce(
        (a, b) =>
          a.flatMap((d: any) => b.map((e: any) => [...d, e])),
        [[]]
      )

    const valueArrays = options.map((opt) =>
      opt.values.map((v: any) => v.value)
    )

    const combinations = cartesian(valueArrays)

    setVariants((prev) =>
      combinations.map((combo) => {
        const key = combo.join("|")

        const oldVariant = prev.find((v) => v.key === key)

        if (oldVariant) {
          return oldVariant
        }

        return {
          key,
          combination: combo,
          price: 0,
          stock: 0,
        }
      })
    )
  }



  // ================= SAVE =================
  const handleSave = async () => {
    const cleanVariants = variants.map((v) => ({
      price: v.price,
      stock: v.stock,
      values: v.combination.map((value, index) => {
        const option = product.Option[index]
        const optionValue = option.values.find(
          (val: any) => val.value === value
        )

        return {
          optionId: option.id,
          optionValueId: optionValue?.id ?? null,
          optionValue: { value },
        }
      }),
    }))

    await fetch("/api/products/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Pid: product.Pid,
        name,
        images,
        options: product.Option,
        variants: cleanVariants,
      }),
    })

    onSuccess()
    onClose()
  }



  // ================= DELETE PRODUCT =================
  const handleDelete = async () => {
    onClose() // ปิด modal ก่อน

    await fetch("/api/products/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Pid: product.Pid }),
    })

    onSuccess()
  }


  // ================= IMAGE =================
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // ================= VARIANT UPDATE =================
  const updateVariant = (key: string, field: string, value: any) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.key === key ? { ...v, [field]: value } : v
      )
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
        {/* ================= OPTIONS ================= */}
        <div>
          <label className="block text-sm font-semibold mb-3">
            Options
          </label>

          <div className="space-y-4">
            {product.Option.map((opt: any, optionIndex: number) => (
              <div
                key={opt.id || optionIndex}
                className="border rounded-lg p-4 bg-gray-50 relative"
              >

                <div className="flex items-center gap-2 mb-4">
                  {/* Option Name */}
                  <input
                    type="text"
                    placeholder="Option name"
                    value={opt.name}
                    onChange={(e) => {
                      const updated = [...product.Option]
                      updated[optionIndex].name = e.target.value
                      setProduct({ ...product, Option: updated })
                    }}
                    className="flex-1 border px-3 py-2 rounded text-sm"
                  />
                  {/* ลบ Option */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = product.Option.filter(
                        (_: any, i: number) => i !== optionIndex
                      )

                      setProduct({ ...product, Option: updated })

                      if (updated.length === 0) {
                        setVariants([])
                      }
                    }}

                    className="cursor-pointer text-gray-500 hover:text-black"
                  >
                    <Trash2 className="size-6" />
                  </button>
                </div>

                {/* Option Values */}
                <div className="space-y-2">
                  {opt.values?.map((val: any, valueIndex: number) => (
                    <div
                      key={val.id || valueIndex}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="ค่า เช่น Red"
                        value={val.value}
                        onChange={(e) => {
                          const updated = [...product.Option]
                          updated[optionIndex].values[valueIndex].value =
                            e.target.value
                          setProduct({ ...product, Option: updated })
                        }}
                        className="flex-1 border px-3 py-2 rounded text-sm"
                      />


                      {/* ลบค่า */}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...product.Option]

                          updated[optionIndex].values =
                            updated[optionIndex].values.filter(
                              (_: any, i: number) => i !== valueIndex
                            )

                          setProduct({ ...product, Option: updated })
                        }}


                        className="cursor-pointer text-gray-500 hover:text-black"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* เพิ่มค่า */}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...product.Option]
                      updated[optionIndex].values.push({
                        id: null,
                        value: "",
                      })
                      setProduct({ ...product, Option: updated })
                    }}
                    className="text-blue-600 text-sm mt-1 cursor-pointer"
                  >
                    + เพิ่มค่า
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* เพิ่ม Option */}
          <button
            type="button"
            onClick={() =>
              setProduct((prev: any) => ({
                ...prev,
                Option: [
                  ...prev.Option,
                  {
                    id: null,
                    name: "",
                    values: [],
                  },
                ],
              }))
            }
            className="text-purple-600 text-sm mt-4 cursor-pointer"
          >
            + เพิ่มตัวเลือก
          </button>
        </div>
        {/* ================= VARIANTS ================= */}
        {variants.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">รายการ Variant</h3>

            <div className="overflow-hidden rounded-sm border border-gray-200">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    {product.Option.map((opt: any, i: number) => (
                      <th key={i} className="border-b p-3 text-left">
                        {opt.name}
                      </th>
                    ))}
                    <th className="border-b p-3 text-left">ราคา</th>
                    <th className="border-b p-3 text-left">คลัง</th>
                  </tr>
                </thead>

                <tbody>
                  {variants.map((variant, rowIndex) => (
                    <tr key={`variant-${rowIndex}`} className="border-t">
                      {variant.combination.map((value, colIndex) => {
                        const span = getRowSpan(
                          variants,
                          rowIndex,
                          colIndex
                        )

                        if (!span) return null

                        return (
                          <td
                            key={`${variant.key}-${colIndex}`}
                            rowSpan={span}
                            className="border-r p-3 align-middle bg-white"
                          >
                            {value}
                          </td>
                        )
                      })}

                      <td className="border-r p-3">
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) =>
                            updateVariant(
                              variant.key,
                              "price",
                              Number(e.target.value)
                            )
                          }
                          className="w-full border rounded-sm px-2 py-1"
                        />
                      </td>

                      <td className="p-3">
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) =>
                            updateVariant(
                              variant.key,
                              "stock",
                              Number(e.target.value)
                            )
                          }
                          className="w-full border rounded-sm px-2 py-1"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}




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

function getRowSpan(
  variants: Variant[],
  rowIndex: number,
  colIndex: number
) {
  const value = variants[rowIndex].combination[colIndex]

  if (
    rowIndex > 0 &&
    variants[rowIndex - 1].combination[colIndex] === value
  ) {
    return 0
  }

  let span = 1
  for (let i = rowIndex + 1; i < variants.length; i++) {
    if (variants[i].combination[colIndex] === value) {
      span++
    } else {
      break
    }
  }
  return span
}

