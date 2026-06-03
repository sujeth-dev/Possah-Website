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
    logoHeight: 52,
    logoWidth: 52,
    wordmarkViewportHeight: 52,
    wordmarkViewportWidth: 154,
    wordmarkImageHeight: 112,
    wordmarkOffsetTop: -29,
    wordmarkOffsetLeft: -12,
    gap: 8,
  },
  'header-mobile': {
    logoHeight: 36,
    logoWidth: 36,
    wordmarkViewportHeight: 36,
    wordmarkViewportWidth: 106,
    wordmarkImageHeight: 77,
    wordmarkOffsetTop: -20,
    wordmarkOffsetLeft: -9,
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
