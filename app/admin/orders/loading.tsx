export default function AdminOrdersLoading() {
  return (
    <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32, backgroundColor: '#F8F7F5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ height: 28, width: 160, backgroundColor: '#E2D9CC', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
        <div style={{ height: 36, width: 120, backgroundColor: '#E2D9CC', borderRadius: 4, animation: 'pulse 1.8s ease-in-out infinite' }} />
      </div>
      {/* Filters row */}
      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 36, width: 120, backgroundColor: '#E2D9CC', borderRadius: 4, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
        ))}
      </div>
      {/* Table */}
      <div style={{ border: '1px solid #E2D9CC', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ height: 48, backgroundColor: '#E2D9CC', animation: 'pulse 1.8s ease-in-out infinite' }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 56, borderTop: '1px solid #E2D9CC', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 20, animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.06}s` }}>
            {[2, 1.5, 1, 1, 0.8].map((flex, j) => (
              <div key={j} style={{ height: 12, backgroundColor: '#E2D9CC', borderRadius: 2, flex }} />
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
