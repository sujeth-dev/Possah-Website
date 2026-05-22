// FIX-FE-02: Category page loading skeleton — 12-card grid with sidebar

export default function CategoryLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Breadcrumb skeleton */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ height: 12, width: 200, backgroundColor: 'var(--color-border)', borderRadius: 2 }} />
      </div>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px', display: 'flex', gap: 40 }}>
        {/* Sidebar skeleton */}
        <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 12, width: '60%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ height: 10, width: '80%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${j * 0.05}s` }} />
              ))}
            </div>
          ))}
        </aside>

        {/* Product grid — 12 cards */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 24 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  aspectRatio: '3/4',
                  backgroundColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  animation: 'pulse 1.8s ease-in-out infinite',
                  animationDelay: `${i * 0.08}s`,
                }}
              />
              <div style={{ height: 14, width: '75%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
              <div style={{ height: 12, width: '45%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}
