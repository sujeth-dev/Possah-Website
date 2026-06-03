'use client'

import React, { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'

interface GalleryImage {
  url: string
  alt: string | null
}

interface ProductGalleryProps {
  images: GalleryImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex]   = useState(0)
  const [touchStart, setTouchStart]     = useState<number | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [mounted, setMounted]           = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const validImages = images.filter((img) => img.url?.trim())
  const safeImages = validImages.length > 0 ? validImages : [{ url: 'https://placehold.co/600x800/1F3A2D/F4ECDF.png?text=Possah', alt: productName }]
  const active = safeImages[activeIndex] ?? safeImages[0]

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % safeImages.length)
  }, [safeImages.length])

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + safeImages.length) % safeImages.length)
  }, [safeImages.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0]?.clientX ?? null)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStart
    if (Math.abs(delta) > 40) {
      delta < 0 ? goNext() : goPrev()
    }
    setTouchStart(null)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft')  goPrev()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, goNext, goPrev])

  const lightbox = lightboxOpen && mounted && createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={() => setLightboxOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setLightboxOpen(false)
        }}
        aria-label="Close image"
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 44,
          height: 44,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.12)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          zIndex: 3,
          touchAction: 'manipulation',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 2l12 12M14 2L2 14" />
        </svg>
      </button>

      {safeImages.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            goPrev()
          }}
          aria-label="Previous image"
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            zIndex: 2,
            touchAction: 'manipulation',
          }}
        >
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M8 1L2 9l6 8" />
          </svg>
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(90vw, 600px)',
          height: 'min(82vh, 800px)',
          zIndex: 1,
        }}
      >
        <Image
          key={active.url}
          src={active.url}
          alt={active.alt ?? productName}
          fill
          quality={95}
          className="object-contain"
          sizes="(max-width: 768px) 90vw, 600px"
        />
      </div>

      {safeImages.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            goNext()
          }}
          aria-label="Next image"
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.12)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            zIndex: 2,
            touchAction: 'manipulation',
          }}
        >
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 1l6 8-6 8" />
          </svg>
        </button>
      )}

      {safeImages.length > 1 && (
        <span
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255,255,255,0.6)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            zIndex: 2,
          }}
        >
          {activeIndex + 1} / {safeImages.length}
        </span>
      )}
    </div>,
    document.body
  )

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 lg:gap-6 md:sticky md:top-[104px] md:self-start">
        <div className="order-2 md:order-1 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0" style={{ scrollbarWidth: 'none' }}>
          {safeImages.slice(0, 5).map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className="flex-shrink-0 transition-opacity duration-150"
              style={{
                width: 64,
                height: 80,
                borderRadius: 'var(--radius-card)',
                overflow: 'hidden',
                border: `1.5px solid ${i === activeIndex ? 'var(--color-green)' : 'transparent'}`,
                opacity: i === activeIndex ? 1 : 0.65,
              }}
              aria-label={`View image ${i + 1}`}
              aria-current={i === activeIndex}
            >
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                width={64}
                height={80}
                className="w-full h-full object-cover object-center"
                sizes="64px"
              />
            </button>
          ))}
        </div>

        <div
          className="order-1 md:order-2 relative flex-1 group"
          style={{ borderRadius: 'var(--radius-card)', overflow: 'hidden' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative w-full" style={{ aspectRatio: '3 / 4' }}>
            <Image
              key={active.url}
              src={active.url}
              alt={active.alt ?? productName}
              fill
              priority
              quality={90}
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            />
          </div>

          <button
            onClick={() => setLightboxOpen(true)}
            aria-label="Zoom image"
            className="absolute inset-0 w-full h-full"
            style={{ cursor: 'zoom-in', background: 'transparent', border: 'none' }}
          />

          <div
            className="absolute bottom-3 right-3 flex items-center justify-center w-8 h-8 pointer-events-none
                        opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
            style={{
              backgroundColor: 'rgba(244,236,223,0.88)',
              borderRadius: '50%',
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="6" cy="6" r="4.5" />
              <path d="M10 10l3 3" />
              <path d="M4 6h4M6 4v4" />
            </svg>
          </div>

          {safeImages.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 md:hidden"
                style={{
                  backgroundColor: 'rgba(244, 236, 223, 0.85)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(4px)',
                }}
                aria-label="Previous image"
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M8 1L2 8l6 7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 md:hidden"
                style={{
                  backgroundColor: 'rgba(244, 236, 223, 0.85)',
                  borderRadius: '50%',
                  backdropFilter: 'blur(4px)',
                }}
                aria-label="Next image"
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M2 1l6 7-6 7" />
                </svg>
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 md:hidden">
                {safeImages.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    aria-label={`Go to image ${i + 1}`}
                    className="transition-all duration-200"
                    style={{
                      width: i === activeIndex ? 16 : 6,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: i === activeIndex ? 'var(--color-bg)' : 'rgba(244, 236, 223, 0.5)',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {lightbox}
    </>
  )
}
