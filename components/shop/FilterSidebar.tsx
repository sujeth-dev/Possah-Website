'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterSection {
  key: string
  label: string
  options: FilterOption[]
  type: 'checkbox' | 'range' | 'swatch'
}

const FILTER_SECTIONS: FilterSection[] = [
  {
    key: 'occasion',
    label: 'Occasion',
    type: 'checkbox',
    options: [
      { value: 'Everyday',  label: 'Everyday'  },
      { value: 'Brunch',    label: 'Brunch'    },
      { value: 'Workwear',  label: 'Workwear'  },
      { value: 'Evening',   label: 'Evening'   },
      { value: 'Cocktail',  label: 'Cocktail'  },
      { value: 'Sangeet',   label: 'Sangeet'   },
      { value: 'Mehendi',   label: 'Mehendi'   },
      { value: 'Haldi',     label: 'Haldi'     },
      { value: 'Wedding',   label: 'Wedding'   },
    ],
  },
  {
    key: 'fabric',
    label: 'Fabric',
    type: 'checkbox',
    options: [
      { value: 'Silk',       label: 'Silk'       },
      { value: 'Linen',      label: 'Linen'      },
      { value: 'Cotton',     label: 'Cotton'     },
      { value: 'Georgette',  label: 'Georgette'  },
      { value: 'Crepe',      label: 'Crepe'      },
      { value: 'Chiffon',    label: 'Chiffon'    },
      { value: 'Modal',      label: 'Modal'      },
      { value: 'Viscose',    label: 'Viscose'    },
      { value: 'Tissue',     label: 'Tissue'     },
      { value: 'Velvette',   label: 'Velvette'   },
      { value: 'Satin',      label: 'Satin'      },
      { value: 'Tulle',      label: 'Tulle'      },
      { value: 'Zari',       label: 'Zari'       },
      { value: 'Poly Blend', label: 'Poly Blend' },
    ],
  },
  {
    key: 'size',
    label: 'Size',
    type: 'checkbox',
    options: [
      { value: 'XS',              label: 'XS'              },
      { value: 'S',               label: 'S'               },
      { value: 'M',               label: 'M'               },
      { value: 'L',               label: 'L'               },
      { value: 'XL',              label: 'XL'              },
      { value: '2XL',             label: '2XL'             },
      { value: '3XL',             label: '3XL'             },
      { value: 'Free Size',       label: 'Free Size'       },
      { value: 'Made-to-Measure', label: 'Made-to-Measure' },
    ],
  },
  {
    key: 'sub_line',
    label: 'Collection',
    type: 'checkbox',
    options: [
      { value: 'THE DRAPE',   label: 'The Drape'   },
      { value: 'THE EDIT',    label: 'The Edit'    },
      { value: 'THE ATELIER', label: 'The Atelier' },
      { value: 'THE VAULT',   label: 'The Vault'   },
    ],
  },
]

interface FilterSidebarProps {
  className?: string
}

export function FilterSidebar({ className = '' }: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['occasion', 'fabric', 'size'])
  )

  const getActiveValues = useCallback(
    (key: string): string[] => {
      const val = searchParams.get(key)
      if (!val) return []
      return val.split(',').filter(Boolean)
    },
    [searchParams]
  )

  const toggleFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const current = getActiveValues(key)
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]

      if (next.length === 0) {
        params.delete(key)
      } else {
        params.set(key, next.join(','))
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, getActiveValues, router, pathname]
  )

  const clearAll = useCallback(() => {
    const params = new URLSearchParams()
    const sort = searchParams.get('sort')
    if (sort) params.set('sort', sort)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const activeCount = FILTER_SECTIONS.reduce(
    (sum, s) => sum + getActiveValues(s.key).length,
    0
  )

  return (
    <aside
      className={`w-full md:w-[220px] lg:w-[250px] flex-shrink-0 ${className}`}
      aria-label="Product filters"
    >
      {/* Filter header */}
      <div
        className="flex items-center justify-between pb-4 mb-2 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
            }}
          >
            FILTERS
          </span>
          {activeCount > 0 && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px]"
              style={{
                backgroundColor: 'var(--color-green)',
                color: 'var(--color-bg)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="hover:opacity-60 transition-opacity duration-200"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter sections */}
      <div className="space-y-0">
        {FILTER_SECTIONS.map((section) => {
          const activeValues = getActiveValues(section.key)
          const isExpanded = expandedSections.has(section.key)

          return (
            <div
              key={section.key}
              className="border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Section toggle — lighter heading treatment */}
              <button
                type="button"
                onClick={() => toggleSection(section.key)}
                className="flex items-center justify-between w-full py-3 hover:opacity-70 transition-opacity duration-200"
                aria-expanded={isExpanded}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    fontWeight: '500',
                    letterSpacing: '0.04em',
                    color: activeValues.length > 0 ? 'var(--color-green)' : 'var(--color-text-muted)',
                  }}
                >
                  {section.label}
                  {activeValues.length > 0 && (
                    <span style={{ fontWeight: '400', marginLeft: 4 }}>({activeValues.length})</span>
                  )}
                </span>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  stroke="var(--color-text-muted)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="transition-transform duration-200"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  aria-hidden="true"
                >
                  <path d="M1 1l4 4 4-4" />
                </svg>
              </button>

              {/* Options */}
              {isExpanded && (
                <div className="pb-3 space-y-0.5">
                  {section.options.map((opt) => {
                    const checked = activeValues.includes(opt.value)
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2.5 cursor-pointer group py-1"
                      >
                        {/* Custom checkbox */}
                        <span
                          className="flex-shrink-0 w-4 h-4 flex items-center justify-center transition-all duration-150"
                          style={{
                            border: `1.5px solid ${checked ? 'var(--color-green)' : 'var(--color-border)'}`,
                            backgroundColor: checked ? 'var(--color-green)' : 'transparent',
                            borderRadius: '2px',
                          }}
                          onClick={() => toggleFilter(section.key, opt.value)}
                        >
                          {checked && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="var(--color-bg)" strokeWidth="1.8" strokeLinecap="round">
                              <path d="M1 3l2 2 4-4" />
                            </svg>
                          )}
                        </span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFilter(section.key, opt.value)}
                          className="sr-only"
                          aria-label={opt.label}
                        />
                        <span
                          className="group-hover:opacity-70 transition-opacity duration-150"
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            color: checked ? 'var(--color-text)' : 'var(--color-text-muted)',
                            fontWeight: checked ? '500' : '400',
                          }}
                        >
                          {opt.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
