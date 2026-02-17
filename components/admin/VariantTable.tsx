type Variant = {
  id: number
  color: string
  size: string
  price: number
  stock: number
}

export default function VariantTable({
  variants,
  setVariants,
}: {
  variants: Variant[]
  setVariants: (v: Variant[]) => void
}) {
  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: any
  ) => {
    const newVariants = [...variants]
    newVariants[index] = {
      ...newVariants[index],
      [field]: value,
    }
    setVariants(newVariants)
  }

  return (
    <div>
      <h3 className="font-semibold mb-3">
        Variants
      </h3>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Color</th>
            <th className="p-2">Size</th>
            <th className="p-2">Price</th>
            <th className="p-2">Stock</th>
          </tr>
        </thead>

        <tbody>
          {variants.map((v, i) => (
            <tr key={v.id}>
              <td className="p-2">{v.color}</td>
              <td className="p-2">{v.size}</td>
              <td className="p-2">
                <input
                  type="number"
                  value={v.price}
                  onChange={(e) =>
                    updateVariant(
                      i,
                      "price",
                      Number(e.target.value)
                    )
                  }
                  className="border px-2 py-1 w-24"
                />
              </td>
              <td className="p-2">
                <input
                  type="number"
                  value={v.stock}
                  onChange={(e) =>
                    updateVariant(
                      i,
                      "stock",
                      Number(e.target.value)
                    )
                  }
                  className="border px-2 py-1 w-20"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
