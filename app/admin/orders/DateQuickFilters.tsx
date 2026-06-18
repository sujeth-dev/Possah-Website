'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Preset = 'today' | 'week' | 'month'

function getDateRange(preset: Preset): { from: string; to: string } {
  const now  = new Date()
  const pad  = (n: number) => String(n).padStart(2, '0')
  const ymd  = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const today = ymd(now)

  if (preset === 'today') {
    return { from: today, to: today }
  }

  if (preset === 'week') {
    const day   = now.getDay() // 0 = Sunday
    const diff  = (day === 0 ? -6 : 1 - day)
    const monday = new Date(now)
    monday.setDate(now.getDate() + diff)
    return { from: ymd(monday), to: today }
  }

  // month
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: ymd(firstDay), to: today }
}

export function DateQuickFilters() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const currentFrom = searchParams.get('from') ?? ''
  const currentTo   = searchParams.get('to')   ?? ''

  function isActive(preset: Preset) {
    const { from, to } = getDateRange(preset)
    return currentFrom === from && currentTo === to
  }

  function apply(preset: Preset) {
    const { from, to } = getDateRange(preset)
    const params = new URLSearchParams(searchParams.toString())
    params.set('from', from)
    params.set('to', to)
    params.delete('page')
    router.push(`/admin/orders?${params.toString()}`)
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('from')
    params.delete('to')
    params.delete('page')
    router.push(`/admin/orders?${params.toString()}`)
  }

  const hasDateFilter = currentFrom || currentTo

  const btnBase: React.CSSProperties = {
    padding:      '5px 14px',
    borderRadius: '6px',
    border:       '1px solid var(--color-border)',
    fontFamily:   'var(--font-body)',
    fontSize:     '12px',
    cursor:       'pointer',
    transition:   'all 0.1s',
    whiteSpace:   'nowrap',
  }

  const btnActive: React.CSSProperties = {
    ...btnBase,
    backgroundColor: 'var(--color-green)',
    borderColor:     'var(--color-green)',
    color:           '#fff',
  }

  const btnIdle: React.CSSProperties = {
    ...btnBase,
    backgroundColor: 'var(--color-surface)',
    color:           'var(--color-text-muted)',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '2px' }}>
        Quick:
      </span>
      {(['today', 'week', 'month'] as const).map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => apply(preset)}
          style={isActive(preset) ? btnActive : btnIdle}
        >
          {preset === 'today' ? 'Today' : preset === 'week' ? 'This Week' : 'This Month'}
        </button>
      ))}
      {hasDateFilter && (
        <button type="button" onClick={clear} style={{ ...btnIdle, borderStyle: 'dashed' }}>
          Clear
        </button>
      )}
    </div>
  )
}
