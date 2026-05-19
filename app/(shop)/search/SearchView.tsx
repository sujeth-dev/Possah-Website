'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductGrid } from '@/components/shop/ProductGrid'
import type { ProductCardData } from '@/app/(shop)/page'

export function SearchView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [inputValue, setInputValue] = useState(initialQuery)
  const [results, setResults] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const doSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      setHasSearched(false)
      return
    }
    setLoading(true)
    setHasSearched(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      setResults(data.products ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Run search when URL query param is set (e.g. from header search)
  useEffect(() => {
    if (initialQuery) {
      doSearch(initialQuery)
    }
  }, [initialQuery, doSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    setQuery(trimmed)
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`, { scroll: false })
    doSearch(trimmed)
  }

  return (
    <div className="container-site py-12 pb-24">
      {/* Search bar */}
      <form onSubmit={handleSubmit} role="search" className="mb-12">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{
            border: '1.5px solid var(--color-green)',
            borderRadius: 'var(--radius-btn)',
            maxWidth: 640,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <path d="M16 16l-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search pieces, fabrics, occasions…"
            autoFocus
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--color-text)',
            }}
            aria-label="Search The Possah"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue('')
                setQuery('')
                setResults([])
                setHasSearched(false)
                router.replace('/search', { scroll: false })
              }}
              aria-label="Clear search"
              className="hover:opacity-60 transition-opacity duration-150"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l10 10M11 1L1 11" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="hidden"
            aria-label="Search"
          />
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <ProductGrid products={[]} loading columns={3} />
      ) : hasSearched ? (
        <div>
          <p
            className="mb-8"
            style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--color-text-muted)' }}
            aria-live="polite"
            aria-atomic="true"
          >
            {results.length === 0
              ? `No results for "${query}"`
              : `${results.length} ${results.length === 1 ? 'piece' : 'pieces'} found for "${query}"`}
          </p>
          <ProductGrid products={results} columns={3} />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(18px, 3vw, 28px)',
              fontWeight: '400',
              color: 'var(--color-text)',
            }}
          >
            What are you looking for?
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--color-text-muted)' }}>
            Search by name, fabric, or occasion — e.g. &ldquo;silk saree&rdquo;, &ldquo;wedding lehenga&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
