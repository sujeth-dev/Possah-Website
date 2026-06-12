'use client'

import Image from 'next/image'
import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Image>, 'onError'> & {
  fallbackSrc?: string
}

export function ImageWithFallback({
  fallbackSrc = '/images/placeholder-product.jpg',
  ...props
}: Props) {
  return (
    <Image
      {...props}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).src = fallbackSrc
      }}
    />
  )
}
