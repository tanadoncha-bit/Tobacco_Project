import { Plus, Sparkles, X } from "lucide-react"

type Props = {
  isOpen: boolean
  onClose: () => void
  newMat: { code: string; name: string; unit: string }
  setNewMat: (val: { code: string; name: string; unit: string }) => void
  onSubmit: () => void
  isLoading: boolean
}

export default function AddMaterialModal({
  isOpen,
  onClose,
  newMat,
  setNewMat,
  onSubmit,
  isLoading,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">

        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
          <div className="flex items-center gap-3 text-purple-700">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-800">เพิ่มวัตถุดิบใหม่</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-700">รหัสวัตถุดิบ</label>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md flex items-center gap-1 tracking-wider uppercase">
                <Sparkles className="w-3 h-3" /> Auto
              </span>
            </div>
            <input
              type="text"
              value={newMat.code}
              disabled
              placeholder="ระบบจะสร้างให้เมื่อบันทึก"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none bg-gray-50 text-gray-500 font-bold cursor-not-allowed pointer-events-none select-none shadow-inner"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              ชื่อวัตถุดิบ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newMat.name}
              onChange={e => setNewMat({ ...newMat, name: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-purple-300"
              placeholder="เช่น แป้งสาลี, น้ำตาลทราย, เมล็ดกาแฟ"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              หน่วยนับ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newMat.unit}
              onChange={e => setNewMat({ ...newMat, unit: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium hover:border-purple-300"
              placeholder="เช่น กรัม, กิโลกรัม, ซอง, ลิตร"
            />
          </div>

          <div className="pt-4 flex gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "บันทึกข้อมูล"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}