'use client'

import { useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FilterSidebar } from './FilterSidebar'
import { useMobileFilterStore } from '@/lib/store/mobileFilterStore'

export function MobileFilterDrawer() {
  const { isOpen, close } = useMobileFilterStore()

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [isOpen])

  // Escape key close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    },
    [close]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="filter-backdrop"
            className="fixed inset-0 z-40 md:hidden"
            style={{ backgroundColor: 'rgba(15, 25, 18, 0.5)', backdropFilter: 'blur(2px)' }}
            onClick={close}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          />

          {/* Drawer panel */}
          <motion.div
            key="filter-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed inset-x-0 bottom-0 z-50 md:hidden flex flex-col"
            style={{
              backgroundColor: 'var(--color-bg)',
              borderRadius: '12px 12px 0 0',
              maxHeight: '85dvh',
              boxShadow: '0 -4px 32px rgba(15, 25, 18, 0.12)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: 'var(--color-border)' }}
              />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text)',
                }}
              >
                FILTERS
              </span>
              <button
                onClick={close}
                className="flex items-center justify-center w-8 h-8 hover:opacity-60 transition-opacity duration-200"
                aria-label="Close filters"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>

            {/* Scrollable filter content */}
            <div className="overflow-y-auto flex-1 px-5 pb-6" style={{ overscrollBehavior: 'contain' }}>
              <FilterSidebar className="w-full" />
            </div>

            {/* Footer — Apply button */}
            <div
              className="flex-shrink-0 px-5 py-4 border-t"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
            >
              <button
                onClick={close}
                className="w-full flex items-center justify-center py-3.5 transition-opacity duration-200 hover:opacity-80"
                style={{
                  backgroundColor: 'var(--color-green)',
                  color: 'var(--color-white)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  borderRadius: 'var(--radius-btn)',
                }}
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
