export default function CategoryLoading() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* Hero skeleton */}
      <div style={{ width: '100%', minHeight: 'clamp(200px, 30vw, 380px)', backgroundColor: 'var(--color-border)', animation: 'pulse 1.8s ease-in-out infinite' }} />

      {/* Breadcrumb skeleton */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '12px 24px' }}>
        <div style={{ height: 12, width: 200, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
      </div>

      {/* Grid skeleton */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'flex', gap: 40 }}>
          {/* Sidebar */}
          <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 14, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          {/* Products */}
          <div style={{ flex: 1 }}>
            <div style={{ height: 14, width: 120, backgroundColor: 'var(--color-border)', borderRadius: 2, marginBottom: 24, animation: 'pulse 1.8s ease-in-out infinite' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ aspectRatio: '3/4', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-card)', animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
                  <div style={{ height: 14, width: '80%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
                  <div style={{ height: 12, width: '40%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
