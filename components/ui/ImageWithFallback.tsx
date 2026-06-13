'use client'

import Image from 'next/image'
import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Image>, 'onError'> & {
  fallbackSrc?: string
}

export function ImageWithFallback({
  fallbackSrc = 'https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg',
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
