'use client'

import Image from 'next/image'
import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Image>, 'onError'> & {
  fallbackSrc?: string
}

export function ImageWithFallback({
  fallbackSrc = '/images/placeholder-product.jpg',
  alt,
  ...props
}: Props) {
  return (
    <Image
      alt={alt}
      {...props}
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).src = fallbackSrc
      }}
    />
  )
}
