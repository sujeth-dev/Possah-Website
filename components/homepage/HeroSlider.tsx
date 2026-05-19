'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { HeroSlide } from '@/app/(shop)/page'

interface HeroSliderProps {
  slides: HeroSlide[]
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Autoplay — 5 second interval
  useEffect(() => {
    if (paused || slides.length <= 1) return
    const interval = setInterval(next, 5000)
    return () => clearInterval(interval)
  }, [next, paused, slides.length])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  if (!slides.length) return null

  const slide = slides[current]!

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(480px, 80vh, 820px)' }}
      aria-label="Hero slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          aria-hidden={i !== current}
        >
          <Image
            src={s.image}
            alt={s.headline}
            fill
            className="object-cover object-center"
            priority={i === 0}
            sizes="100vw"
          />
          {/* Dark gradient overlay — bottom-left for text legibility */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to top right, rgba(15,25,18,0.65) 0%, rgba(15,25,18,0.15) 60%, transparent 100%)',
            }}
            aria-hidden="true"
          />
        </div>
      ))}

      {/* Text content — bottom left, like design */}
      <div className="absolute bottom-0 left-0 right-0 pb-12 md:pb-16 px-6 md:px-14 lg:px-20 max-w-[1440px] mx-auto">
        <div className="max-w-[480px]">
          {/* Sub-label */}
          {slide.subheadline && (
            <p
              className="mb-3 md:mb-4"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-label)',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'rgba(244,236,223,0.75)',
              }}
            >
              {slide.subheadline}
            </p>
          )}

          {/* Headline — Possah Sans / display style, lowercase intentional */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 6vw, 80px)',
              fontWeight: '400',
              lineHeight: 1.0,
              color: 'var(--color-white)',
              letterSpacing: '-0.01em',
              marginBottom: '24px',
            }}
          >
            {slide.headline}
          </h1>

          {/* CTA */}
          <Link
            href={slide.ctaLink}
            className="inline-flex items-center gap-2 transition-opacity duration-200 hover:opacity-85"
            style={{
              backgroundColor: 'var(--color-green)',
              color: 'var(--color-bg)',
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              fontWeight: '500',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '13px 28px',
              borderRadius: 'var(--radius-btn)',
            }}
          >
            {slide.ctaLabel}
          </Link>
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-opacity duration-200 hover:opacity-70"
            style={{
              backgroundColor: 'rgba(244,236,223,0.15)',
              borderRadius: '50%',
              color: 'var(--color-white)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="Previous slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 2L4 8l6 6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-opacity duration-200 hover:opacity-70"
            style={{
              backgroundColor: 'rgba(244,236,223,0.15)',
              borderRadius: '50%',
              color: 'var(--color-white)',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="Next slide"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 2l6 6-6 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2"
          role="tablist"
          aria-label="Slide indicators"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === current}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setCurrent(i)}
              className="transition-all duration-300"
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-white)',
                opacity: i === current ? 1 : 0.45,
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}
