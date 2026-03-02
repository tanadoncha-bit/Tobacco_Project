import { useRef } from "react"
import { Hammer, X, ChevronDown } from "lucide-react"

type ProductOption = {
  id: number
  productId: number
  name: string
  hasRecipe: boolean
}

type ProduceForm = {
  variantId: string
  amount: string
  note: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  products: ProductOption[]
  produceForm: ProduceForm
  setProduceForm: (form: ProduceForm) => void
  isProductDropdownOpen: boolean
  setIsProductDropdownOpen: (val: boolean) => void
  productDropdownRef: React.RefObject<HTMLDivElement | null>
  onSubmit: () => void
  isLoading: boolean
}

export default function ProduceModal({
  isOpen,
  onClose,
  products,
  produceForm,
  setProduceForm,
  isProductDropdownOpen,
  setIsProductDropdownOpen,
  productDropdownRef,
  onSubmit,
  isLoading,
}: Props) {
  if (!isOpen) return null

  const selectedProduct = products.find(p => p.id.toString() === produceForm.variantId)
  const selectedProductLabel = selectedProduct ? selectedProduct.name : "-- กรุณาเลือกสินค้า --"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
          <div className="flex items-center gap-2 text-orange-600">
            <Hammer className="w-5 h-5" />
            <h2 className="text-lg font-bold">เบิกผลิตสินค้า</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-orange-50/80 border border-orange-100 p-3.5 rounded-xl text-sm text-orange-800 leading-relaxed font-medium">
            ระบบจะทำการเบิกวัตถุดิบออกตาม <b className="text-orange-900">"สูตร"</b> ของสินค้าที่เลือก
            และเพิ่มจำนวนเข้าไปใน <b className="text-orange-900">"สต๊อกสินค้าสำเร็จรูป"</b> อัตโนมัติ
          </div>

          {/* Product Dropdown */}
          <div className="space-y-2" ref={productDropdownRef}>
            <label className="block text-sm font-bold text-gray-700">เลือกสินค้าที่จะผลิต *</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                className={`w-full flex items-center justify-between border ${
                  isProductDropdownOpen
                    ? "ring-2 ring-orange-500"
                    : "border-gray-200 hover:border-orange-300"
                } rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:bg-white transition-all cursor-pointer text-left`}
              >
                <span className={produceForm.variantId ? "text-gray-800 font-bold" : "text-gray-400 font-medium truncate"}>
                  {selectedProductLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 ml-2 flex-shrink-0 transition-transform duration-200 ${
                    isProductDropdownOpen ? "rotate-180 text-orange-500" : ""
                  }`}
                />
              </button>

              {isProductDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1.5">
                    {products.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">ไม่มีข้อมูลสินค้า</div>
                    ) : (
                      products.map(p => {
                        const isSelected = produceForm.variantId === p.id.toString()
                        const isDisabled = !p.hasRecipe || p.id === -1

                        return (
                          <button
                            key={`${p.productId}-${p.id}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setProduceForm({ ...produceForm, variantId: p.id.toString() })
                              setIsProductDropdownOpen(false)
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex justify-between items-center ${
                              isSelected
                                ? "bg-orange-50 text-orange-700 font-bold border-l-4 border-orange-500"
                                : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent font-medium"
                            } ${isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}`}
                          >
                            <span>{p.name}</span>
                            {isDisabled && (
                              <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold ml-2">
                                ไม่มีสูตร
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              จำนวนสินค้าที่จะผลิต (ชิ้น) *
            </label>
            <input
              type="number"
              min="1"
              value={produceForm.amount}
              onChange={e => setProduceForm({ ...produceForm, amount: e.target.value })}
              placeholder="เช่น 1, 5, 10"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white bg-gray-50 transition-all font-medium"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">หมายเหตุ (ถ้ามี)</label>
            <input
              type="text"
              value={produceForm.note}
              onChange={e => setProduceForm({ ...produceForm, note: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white bg-gray-50 transition-all font-medium"
              placeholder="เช่น ผลิตล๊อตที่ 1"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "ยืนยันการผลิต"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}