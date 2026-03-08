import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  variantId: number
  name: string
  variantName: string // เช่น "Size: XL | Color: Red"
  price: number
  quantity: number
  imageUrl?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  updateQuantity: (variantId: number, quantity: number) => void
  clearCart: () => void
  getTotalAmount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find((i) => i.variantId === newItem.variantId)
          if (existing) {
            // ถ้ามีอยู่แล้ว ให้บวกจำนวนเพิ่ม
            return {
              items: state.items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            }
          }
          // ถ้ายังไม่มี ให้เพิ่มเข้าไปใหม่
          return { items: [...state.items, newItem] }
        })
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }))
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotalAmount: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
    }),
    {
      name: "shopping-cart", // เก็บไว้ใน localStorage
    }
  )
)