// FIX-FE-02: PDP loading skeleton — gallery + product info two-column layout

export default function PDPLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '40px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 64,
        }}
      >
        {/* Gallery skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Main image */}
          <div
            style={{
              aspectRatio: '3/4',
              backgroundColor: 'var(--color-border)',
              borderRadius: 'var(--radius-card)',
              animation: 'pulse 1.8s ease-in-out infinite',
            }}
          />
          {/* Thumbnails */}
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 72,
                  height: 90,
                  backgroundColor: 'var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  animation: 'pulse 1.8s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 16 }}>
          {/* Category + name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 11, width: 100, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
            <div style={{ height: 36, width: '80%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
            <div style={{ height: 20, width: '30%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
          </div>

          {/* Colour swatches */}
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--color-border)', animation: 'pulse 1.8s ease-in-out infinite' }} />
            ))}
          </div>

          {/* Size buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ width: 48, height: 40, backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-btn)', animation: 'pulse 1.8s ease-in-out infinite' }} />
            ))}
          </div>

          {/* CTA button */}
          <div style={{ height: 52, backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-btn)', animation: 'pulse 1.8s ease-in-out infinite' }} />

          {/* Description lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 12, width: i === 3 ? '60%' : '100%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
