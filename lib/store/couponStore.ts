import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CouponDiscountType = 'percent' | 'flat' | 'free_shipping'

interface CouponState {
  code: string
  discountType: CouponDiscountType | null
  discountValue: number
  isFreeShipping: boolean
  setCoupon: (code: string, discountType: CouponDiscountType, discountValue: number) => void
  clearCoupon: () => void
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      code: '',
      discountType: null,
      discountValue: 0,
      isFreeShipping: false,

      setCoupon: (code, discountType, discountValue) =>
        set({
          code,
          discountType,
          discountValue,
          isFreeShipping: discountType === 'free_shipping',
        }),

      clearCoupon: () =>
        set({ code: '', discountType: null, discountValue: 0, isFreeShipping: false }),
    }),
    { name: 'possah-coupon' }
  )
)
