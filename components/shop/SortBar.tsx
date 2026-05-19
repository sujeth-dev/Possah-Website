'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { useMobileFilterStore } from '@/lib/store/mobileFilterStore'

const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest'          },
  { value: 'price-asc', label: 'Price: Low–High' },
  { value: 'price-desc', label: 'Price: High–Low' },
  { value: 'bestselling', label: 'Best Selling'   },
] as const

interface SortBarProps {
  resultCount: number
  onFiltersToggle?: () => void
  showFilterButton?: boolean
}

export function SortBar({ resultCount, onFiltersToggle, showFilterButton = false }: SortBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') ?? 'newest'
  const openMobileFilters = useMobileFilterStore((s) => s.open)

  const handleSort = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('sort', value)
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  return (
    <div
      className="flex items-center justify-between py-3 mb-6 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Left: result count + mobile filter toggle */}
      <div className="flex items-center gap-3">
        {showFilterButton && (
          <button
            onClick={onFiltersToggle ?? openMobileFilters}
            className="flex items-center gap-2 md:hidden hover:opacity-70 transition-opacity duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
            }}
            aria-label="Toggle filters"
          >
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1h12M3 6h8M5 11h4" />
            </svg>
            Filters
          </button>
        )}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text-muted)',
          }}
          aria-live="polite"
          aria-atomic="true"
        >
          {resultCount === 0
            ? 'No results'
            : `Showing ${resultCount} ${resultCount === 1 ? 'piece' : 'pieces'}`}
        </p>
      </div>

      {/* Right: sort dropdown */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="sort-select"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          Sort
        </label>
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => handleSort(e.target.value)}
          className="appearance-none cursor-pointer"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--color-text)',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '2px 20px 2px 0',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B6B6B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 0 center',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
