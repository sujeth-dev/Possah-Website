'use client'

import React, { useEffect } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'

interface LightboxImage {
  url: string
  alt: string | null
}

interface ProductLightboxProps {
  images: LightboxImage[]
  activeIndex: number
  productName: string
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

export default function ProductLightbox({
  images,
  activeIndex,
  productName,
  onClose,
  onNext,
  onPrev,
}: ProductLightboxProps) {
  const active = images[activeIndex] ?? images[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onNext, onPrev])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={onClose}
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
          onClose()
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

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
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
          key={active?.url}
          src={active?.url ?? ''}
          alt={active?.alt ?? productName}
          fill
          quality={95}
          className="object-contain"
          sizes="(max-width: 768px) 90vw, 600px"
        />
      </div>

      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNext()
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

      {images.length > 1 && (
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
          {activeIndex + 1} / {images.length}
        </span>
      )}
    </div>,
    document.body
  )
}
