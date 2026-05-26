export default function AdminProductsLoading() {
  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32, backgroundColor: '#F8F7F5', minHeight: '100vh' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ height: 28, width: 180, backgroundColor: '#E2D9CC', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
        <div style={{ height: 36, width: 140, backgroundColor: '#E2D9CC', borderRadius: 4, animation: 'pulse 1.8s ease-in-out infinite' }} />
      </div>

      {/* Filter + search row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ height: 36, flex: 1, maxWidth: 280, backgroundColor: '#E2D9CC', borderRadius: 4, animation: 'pulse 1.8s ease-in-out infinite' }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ height: 36, width: 110, backgroundColor: '#E2D9CC', borderRadius: 4, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>

      {/* Product grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ border: '1px solid #E2D9CC', borderRadius: 8, overflow: 'hidden', animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.05}s` }}>
            {/* Image placeholder */}
            <div style={{ height: 220, backgroundColor: '#E2D9CC' }} />
            {/* Card body */}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 14, width: '70%', backgroundColor: '#E2D9CC', borderRadius: 2 }} />
              <div style={{ height: 12, width: '45%', backgroundColor: '#E2D9CC', borderRadius: 2 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <div style={{ height: 18, width: 60, backgroundColor: '#E2D9CC', borderRadius: 2 }} />
                <div style={{ height: 28, width: 68, backgroundColor: '#E2D9CC', borderRadius: 4 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
