'use client'

import Image from 'next/image'
import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Image>, 'onError'> & {
  fallbackSrc?: string
}

export function ImageWithFallback({
  fallbackSrc = 'https://cdn.thepossah.com/ui/placeholder.svg',
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
