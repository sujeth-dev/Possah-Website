'use client'

import { useState, useId, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AccordionItemProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function AccordionItem({ title, children, defaultOpen = false, className }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div className={cn('border-b', className)} style={{ borderColor: 'var(--color-border)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-4 text-left hover:opacity-70 transition-opacity duration-200"
        aria-expanded={open}
        aria-controls={contentId}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--color-text)',
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </span>
        <span
          className="flex-shrink-0 ml-4 transition-transform duration-200"
          style={{
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            fontSize: '20px',
            color: 'var(--color-text-muted)',
            lineHeight: 1,
            fontWeight: '300',
          }}
          aria-hidden="true"
        >
          +
        </span>
      </button>

      <div
        id={contentId}
        role="region"
        aria-hidden={!open}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: open ? '600px' : '0',
          opacity: open ? 1 : 0,
        }}
      >
        <div
          className="pb-5"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            lineHeight: 1.7,
            color: 'var(--color-text-muted)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

interface AccordionGroupProps {
  children: ReactNode
  className?: string
}

export function AccordionGroup({ children, className }: AccordionGroupProps) {
  return (
    <div
      className={cn('border-t', className)}
      style={{ borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  )
}
