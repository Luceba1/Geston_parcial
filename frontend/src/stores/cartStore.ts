import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
  imagen?: string
  excludedIngredientIds?: number[]
  personalizacion?: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productoId: number) => void
  updateQuantity: (productoId: number, cantidad: number) => void
  updatePersonalization: (productoId: number, excludedIngredientIds: number[], personalizacion: string) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items
        const key = `${item.productoId}-${[...(item.excludedIngredientIds || [])].sort().join(',')}`
        const existing = items.find((i) => {
          const iKey = `${i.productoId}-${[...(i.excludedIngredientIds || [])].sort().join(',')}`
          return iKey === key
        })
        if (existing) {
          set({
            items: items.map((i) =>
              i.productoId === existing.productoId &&
              [...(i.excludedIngredientIds || [])].sort().join(',') === [...(existing.excludedIngredientIds || [])].sort().join(',')
                ? { ...i, cantidad: i.cantidad + item.cantidad }
                : i
            ),
          })
        } else {
          set({ items: [...items, item] })
        }
      },
      removeItem: (productoId) => {
        set({ items: get().items.filter((i) => i.productoId !== productoId) })
      },
      updateQuantity: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId)
        } else {
          set({
            items: get().items.map((i) =>
              i.productoId === productoId ? { ...i, cantidad } : i
            ),
          })
        }
      },
      updatePersonalization: (productoId, excludedIngredientIds, personalizacion) => {
        set({
          items: get().items.map((i) =>
            i.productoId === productoId
              ? { ...i, excludedIngredientIds, personalizacion }
              : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.cantidad, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + item.precio * item.cantidad, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
)
