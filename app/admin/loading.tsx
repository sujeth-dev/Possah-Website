// FIX-FE-02: Admin loading skeleton

export default function AdminLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F5', display: 'flex' }}>
      {/* Sidebar skeleton */}
      <div style={{ width: 240, borderRight: '1px solid #E2D9CC', padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 20, width: 120, backgroundColor: '#E2D9CC', borderRadius: 2, marginBottom: 24, animation: 'pulse 1.8s ease-in-out infinite' }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 36, backgroundColor: '#E2D9CC', borderRadius: 4, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ height: 28, width: 200, backgroundColor: '#E2D9CC', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
          <div style={{ height: 40, width: 120, backgroundColor: '#E2D9CC', borderRadius: 4, animation: 'pulse 1.8s ease-in-out infinite' }} />
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ padding: 24, border: '1px solid #E2D9CC', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.1}s` }}>
              <div style={{ height: 12, width: 80, backgroundColor: '#E2D9CC', borderRadius: 2 }} />
              <div style={{ height: 28, width: 100, backgroundColor: '#E2D9CC', borderRadius: 2 }} />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div style={{ border: '1px solid #E2D9CC', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ height: 48, backgroundColor: '#E2D9CC', animation: 'pulse 1.8s ease-in-out infinite' }} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: 56, borderTop: '1px solid #E2D9CC', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 20, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.08}s` }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} style={{ height: 12, backgroundColor: '#E2D9CC', borderRadius: 2, flex: j === 0 ? 2 : 1 }} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
