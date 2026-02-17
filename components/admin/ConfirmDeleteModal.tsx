export default function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[350px]">
        <h2 className="font-bold mb-3">
          Confirm Delete
        </h2>
        <p className="text-sm text-gray-600 mb-5">
          Are you sure you want to delete this product?
        </p>

        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="cursor-pointer">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-sm cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
