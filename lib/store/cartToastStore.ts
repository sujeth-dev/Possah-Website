import { create } from 'zustand'

export interface ToastItem {
  name:  string
  image: string
  price: number
}

interface CartToastState {
  item:  ToastItem | null
  show:  (item: ToastItem) => void
  hide:  () => void
}

export const useCartToastStore = create<CartToastState>((set) => ({
  item: null,
  show: (item) => set({ item }),
  hide: ()     => set({ item: null }),
}))
