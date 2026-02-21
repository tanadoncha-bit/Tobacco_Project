"use client"

import { useState, useEffect, useRef } from "react"
import { ImagePlus, Trash2 } from "lucide-react"
import { toast } from "sonner"

type OptionValue = {
  value: string
}

type ProductOption = {
  name: string
  values: OptionValue[]
}

type Variant = {
  key: string
  combination: string[]
  price: number
  stock: number
}

export default function AddProductModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [images, setImages] = useState<File[]>([])

  const [hasOptions, setHasOptions] = useState(false)
  const [options, setOptions] = useState<ProductOption[]>([])
  const [variants, setVariants] = useState<Variant[]>([])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) {
      setName("")
      setPrice("")
      setStock("")
      setImages([])
      setHasOptions(false)
      setOptions([])
      setVariants([])
    }
  }, [open])

  useEffect(() => {
    if (!hasOptions) {
      setVariants([])
      return
    }

    const valueArrays = options.map((opt) =>
      Array.from(
        new Set(
          opt.values
            .map((v) => v.value.trim())
            .filter(Boolean)
        )
      )

    )

    if (valueArrays.some((arr) => arr.length === 0)) {
      setVariants([])
      return
    }

    if (options.some(opt => !opt.name.trim())) {
      setVariants([])
      return
    }


    const cartesian = (arr: string[][]): string[][] =>
      arr.reduce(
        (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
        [[]] as string[][]
      )

    const combinations = cartesian(valueArrays)

    const sorted = combinations.sort((a, b) => {
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
          return a[i].localeCompare(b[i])
        }
      }
      return 0
    })

    setVariants((prev) => {
      return sorted.map((combo) => {
        const comboKey = combo.join("|")
        const existing = prev.find(
          (v) => v.combination.join("|") === comboKey
        )

        return (
          existing || {
            key: comboKey,
            combination: combo,
            price: 0,
            stock: 0,
          }
        )
      })
    })
  }, [options, hasOptions])





  if (!open) return null

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    setImages((prev) => [...prev, ...files])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const addOption = () => {
    setOptions((prev) => [...prev, { name: "", values: [] }])
  }

  const removeOption = (optIndex: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== optIndex))
  }

  const addOptionValue = (optIndex: number) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIndex
          ? { ...opt, values: [...opt.values, { value: "" }] }
          : opt
      )
    )
  }

  const removeOptionValue = (optIndex: number, valueIndex: number) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === optIndex
          ? {
            ...opt,
            values: opt.values.filter((_, vi) => vi !== valueIndex),
          }
          : opt
      )
    )
  }

  const updateVariant = (
    key: string,
    field: "price" | "stock",
    value: number
  ) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.key === key ? { ...v, [field]: value } : v
      )
    )
  }

  const handleSubmit = async () => {
    try {
      if (!name.trim()) {
        toast.error("กรุณากรอกชื่อสินค้า", { position: "top-center" })
        return
      }

      if (
        hasOptions &&
        variants.some(v => v.price <= 0 || v.stock < 0)
      ) {
        toast.error("กรุณากรอกราคาและคลังของทุกตัวเลือก" , { position: "top-center" })
        return
      }

      if (!hasOptions) {
        if (!price || !stock) {
          toast.error("กรุณากรอกราคาและคลัง" , { position: "top-center" })
          return
        }

        if (Number(price) <= 0) {
          toast.error("ราคาต้องมากกว่า 0" , { position: "top-center" })
          return
        }

        if (Number(stock) < 0) {
          toast.error("คลังสินค้าห้ามติดลบ", { position: "top-center" })
          return
        }
      }


      let finalVariants = []

      if (hasOptions) {
        if (variants.length === 0) {
          toast.error("กรุณาสร้างตัวเลือกสินค้า" , { position: "top-center" })
          return
        }

        finalVariants = variants
      } else {
        if (!price || !stock) {
          toast.error("กรุณากรอกราคาและคลัง", { position: "top-center" }) 
          return
        }

        finalVariants = [
          {
            key: "default",
            combination: [],
            price: Number(price),
            stock: Number(stock),
          },
        ]
      }

      const imageUrls: string[] = []

      for (const file of images) {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const data = await res.json()

        if (data.url) {
          imageUrls.push(data.url)
        }
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          imageUrls,
          options: hasOptions ? options : [],
          variants: finalVariants,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error("CREATE ERROR:", data)
        toast.error("เกิดข้อผิดพลาดในการบันทึก" , { position: "top-center" })
        return
      }

      toast.success("บันทึกสำเร็จ" , { position: "top-center" })
      onSuccess()
      onClose()

    } catch (err) {
      console.error("SUBMIT ERROR:", err)
      toast.error("ระบบขัดข้อง" , { position: "top-center" })
    }
  }


  const sortedVariants = [...variants].sort((a, b) => {
    for (let i = 0; i < a.combination.length; i++) {
      if (a.combination[i] < b.combination[i]) return -1
      if (a.combination[i] > b.combination[i]) return 1
    }
    return 0
  })


  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[600px] p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Add Product</h2>

        <p className="text-sm font-medium mb-2">Product Images</p>
        <div className="flex gap-3 flex-wrap mb-4">
          {images.map((file, index) => (
            <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden group">
              <img
                src={URL.createObjectURL(file)}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          ))}

          <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-sm text-gray-500">
            <ImagePlus />
            เพิ่มรูป
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleAddImage}
            />
          </label>
        </div>

        <input
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 px-3 py-2 border rounded"
        />

        {!hasOptions && (
          <input
            placeholder="Price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded"
          />
        )}

        {!hasOptions && (
          <input
            placeholder="Amount"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full mb-4 px-3 py-2 border rounded"
          />
        )}

        <label className="flex items-center gap-2 mb-3 text-sm">
          <input
            type="checkbox"
            checked={hasOptions}
            onChange={(e) => {
              const checked = e.target.checked
              setHasOptions(checked)

              if (checked) {
                setPrice("")
                setStock("")
              } else {
                setOptions([])
                setVariants([])
              }
            }}
            className="cursor-pointer"
          />
          สินค้ามีตัวเลือก (สี / ขนาด / รสชาติ)
        </label>


        {hasOptions && (
          <div className="space-y-4 mb-6">
            {options.map((opt, i) => (
              <div key={i} className="border rounded p-3">
                <div className="flex gap-2 mb-2">
                  <input
                    placeholder="Option name"
                    value={opt.name}
                    onChange={(e) =>
                      setOptions((prev) =>
                        prev.map((o, idx) =>
                          idx === i ? { ...o, name: e.target.value } : o
                        )
                      )
                    }
                    className="flex-1 border px-2 py-1 rounded text-sm"
                  />

                  <button onClick={() => removeOption(i)} className="cursor-pointer text-gray-500 hover:text-black">
                    <Trash2 className="size-5" />
                  </button>
                </div>

                {opt.values.map((v, j) => (
                  <div key={j} className="flex gap-2 mb-2">
                    <input
                      placeholder="ค่า เช่น Red"
                      value={v.value}
                      onChange={(e) =>
                        setOptions((prev) =>
                          prev.map((o, idx) =>
                            idx === i
                              ? {
                                ...o,
                                values: o.values.map((val, vi) =>
                                  vi === j
                                    ? { value: e.target.value }
                                    : val
                                ),
                              }
                              : o
                          )
                        )
                      }
                      className="flex-1 border px-2 py-1 rounded text-sm"
                    />

                    <button onClick={() => removeOptionValue(i, j)} className="cursor-pointer text-gray-500 hover:text-black">
                      ✕
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addOptionValue(i)}
                  className="text-xs text-blue-600 cursor-pointer"
                >
                  + เพิ่มค่า
                </button>
              </div>
            ))}

            <button
              onClick={addOption}
              className="text-sm text-purple-600 cursor-pointer"
            >
              + เพิ่มตัวเลือก
            </button>
          </div>
        )}

        {hasOptions && variants.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">รายการ Variant</h3>

            <div className="overflow-hidden rounded-sm border border-gray-200">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    {options.map((opt, i) => (
                      <th key={i} className="border-b p-3 text-left">
                        {opt.name}
                      </th>
                    ))}
                    <th className="border-b p-3 text-left">ราคา</th>
                    <th className="border-b p-3 text-left">คลัง</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedVariants.map((variant, rowIndex) => {
                    return (
                      <tr key={variant.key} className="border-t">
                        {variant.combination.map((value, colIndex) => {
                          const span = getRowSpan(
                            sortedVariants,
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}


        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg text-sm cursor-pointer">Cancel</button>
          <button
            onClick={handleSubmit}
            className="bg-purple-600 text-white px-4 py-2 ml-2 rounded-lg cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
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

