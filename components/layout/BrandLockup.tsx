'use client'

import Image from 'next/image'

type BrandLockupVariant = 'header-desktop' | 'header-mobile' | 'footer'

interface BrandLockupProps {
  variant: BrandLockupVariant
  className?: string
}

type LockupMetrics = {
  logoHeight: number
  logoWidth: number
  wordmarkViewportHeight: number
  wordmarkViewportWidth: number
  wordmarkImageHeight: number
  wordmarkOffsetTop: number
  wordmarkOffsetLeft: number
  gap: number
}

const LOCKUP_METRICS: Record<BrandLockupVariant, LockupMetrics> = {
  'header-desktop': {
    logoHeight: 60,
    logoWidth: 60,
    wordmarkViewportHeight: 60,
    wordmarkViewportWidth: 178,
    wordmarkImageHeight: 130,
    wordmarkOffsetTop: -34,
    wordmarkOffsetLeft: -14,
    gap: 10,
  },
  'header-mobile': {
    logoHeight: 40,
    logoWidth: 40,
    wordmarkViewportHeight: 40,
    wordmarkViewportWidth: 118,
    wordmarkImageHeight: 86,
    wordmarkOffsetTop: -22,
    wordmarkOffsetLeft: -10,
    gap: 6,
  },
  footer: {
    logoHeight: 40,
    logoWidth: 40,
    wordmarkViewportHeight: 40,
    wordmarkViewportWidth: 122,
    wordmarkImageHeight: 86,
    wordmarkOffsetTop: -22,
    wordmarkOffsetLeft: -10,
    gap: 8,
  },
}

export function BrandLockup({ variant, className }: BrandLockupProps) {
  const metrics = LOCKUP_METRICS[variant]

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${metrics.gap}px`,
      }}
    >
      <Image
        src="/images/logo.png"
        alt=""
        width={metrics.logoWidth}
        height={metrics.logoHeight}
        priority
        className="object-contain flex-shrink-0"
        style={{
          height: `${metrics.logoHeight}px`,
          width: 'auto',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'relative',
          height: `${metrics.wordmarkViewportHeight}px`,
          width: `${metrics.wordmarkViewportWidth}px`,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Image
          src="/images/name.png"
          alt="The Possah"
          width={256}
          height={171}
          priority
          style={{
            position: 'absolute',
            top: `${metrics.wordmarkOffsetTop}px`,
            left: `${metrics.wordmarkOffsetLeft}px`,
            height: `${metrics.wordmarkImageHeight}px`,
            width: 'auto',
            maxWidth: 'none',
          }}
        />
      </div>
    </div>
  )
}
