import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId:          string
  variantId:          string
  name:               string
  image:              string
  price:              number
  colour:             string
  colourHex:          string
  size:               string
  qty:                number
  slug:               string
  availableVariants?: { variantId: string; size: string; stock_qty: number }[]
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void
  removeItem: (productId: string, variantId: string) => void
  updateQty: (productId: string, variantId: string, qty: number) => void
  updateVariant: (productId: string, variantId: string, newVariantId: string, newSize: string) => void
  clearCart: () => void
  subtotal: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get()
        const existing = items.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        )

        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId && i.variantId === item.variantId
                ? { ...i, qty: i.qty + (item.qty ?? 1) }
                : i
            ),
          })
        } else {
          set({ items: [...items, { ...item, qty: item.qty ?? 1 }] })
        }
      },

      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        })
      },

      updateQty: (productId, variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId && i.variantId === variantId ? { ...i, qty } : i
          ),
        })
      },

      updateVariant: (productId, variantId, newVariantId, newSize) => {
        const items   = get().items
        const current = items.find((i) => i.productId === productId && i.variantId === variantId)
        if (!current) return

        const existing = items.find((i) => i.productId === productId && i.variantId === newVariantId)
        if (existing) {
          // Target variant already in cart — merge qty, remove source
          set({
            items: items
              .filter((i) => !(i.productId === productId && i.variantId === variantId))
              .map((i) =>
                i.productId === productId && i.variantId === newVariantId
                  ? { ...i, qty: i.qty + current.qty }
                  : i
              ),
          })
        } else {
          // Swap variant in-place
          set({
            items: items.map((i) =>
              i.productId === productId && i.variantId === variantId
                ? { ...i, variantId: newVariantId, size: newSize }
                : i
            ),
          })
        }
      },

      clearCart: () => set({ items: [] }),

      subtotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.qty, 0),

      itemCount: () => get().items.reduce((sum, item) => sum + item.qty, 0),
    }),
    {
      name: 'possah-cart',
    }
  )
)
