import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WishlistItem {
  productId: string
  variantId: string | null
  name: string
  image: string
  price: number
  slug: string
}

interface WishlistState {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  toggleItem: (item: WishlistItem) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  count: () => number
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { items } = get()
        if (!items.find((i) => i.productId === item.productId)) {
          set({ items: [...items, item] })
        }
      },

      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) })
      },

      toggleItem: (item) => {
        const { items, addItem, removeItem } = get()
        if (items.find((i) => i.productId === item.productId)) {
          removeItem(item.productId)
        } else {
          addItem(item)
        }
      },

      isInWishlist: (productId) =>
        !!get().items.find((i) => i.productId === productId),

      clearWishlist: () => set({ items: [] }),

      count: () => get().items.length,
    }),
    {
      name: 'possah-wishlist',
    }
  )
)
