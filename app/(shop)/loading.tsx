// FIX-FE-02: Shop segment loading skeleton

export default function ShopLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Nav placeholder */}
      <div style={{ height: 72, borderBottom: '1px solid var(--color-border)' }} />

      {/* Hero skeleton */}
      <div
        style={{
          height: 520,
          backgroundColor: 'var(--color-border)',
          animation: 'pulse 1.8s ease-in-out infinite',
        }}
      />

      {/* Product grid skeleton */}
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: '64px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 24,
          width: '100%',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                aspectRatio: '3/4',
                backgroundColor: 'var(--color-border)',
                borderRadius: 'var(--radius-card)',
                animation: 'pulse 1.8s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }}
            />
            <div style={{ height: 16, backgroundColor: 'var(--color-border)', borderRadius: 2, width: '70%', animation: 'pulse 1.8s ease-in-out infinite' }} />
            <div style={{ height: 14, backgroundColor: 'var(--color-border)', borderRadius: 2, width: '40%', animation: 'pulse 1.8s ease-in-out infinite' }} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
