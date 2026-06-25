'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  full: 'max-w-[95vw]',
}

export function Modal({ open, onClose, title, children, size = 'md', className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      dialogRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal-root"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--color-overlay)' }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={cn(
              'relative w-full z-10 focus:outline-none',
              SIZE_CLASSES[size],
              className
            )}
            style={{
              backgroundColor: 'var(--color-bg)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
              borderRadius: 'var(--radius-card)',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0, 0.25, 1] }}
          >
            {/* Header */}
            {title && (
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    fontWeight: '500',
                    color: 'var(--color-text)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center hover:opacity-60 transition-opacity"
                  aria-label="Close dialog"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-text)" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 1l14 14M15 1L1 15" />
                  </svg>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
