// FIX-FE-02: Cart page loading skeleton

export default function CartLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48 }}>
        {/* Cart items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ height: 18, width: 120, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ width: 80, height: 104, backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-card)', flexShrink: 0, animation: 'pulse 1.8s ease-in-out infinite' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 14, width: '70%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
                <div style={{ height: 12, width: '50%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
                <div style={{ height: 12, width: '30%', backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{ padding: 24, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 14, width: 120, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ height: 12, width: 80, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
              <div style={{ height: 12, width: 60, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
            </div>
          ))}
          <div style={{ height: 48, backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-btn)', animation: 'pulse 1.8s ease-in-out infinite', marginTop: 8 }} />
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
