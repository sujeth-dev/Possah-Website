// FIX-FE-02: Account page loading skeleton

export default function AccountLoading() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', padding: '64px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ height: 32, width: 200, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
          <div style={{ height: 14, width: 280, backgroundColor: 'var(--color-border)', borderRadius: 2, animation: 'pulse 1.8s ease-in-out infinite' }} />
        </div>

        {/* Order list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: 20, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: 'pulse 1.8s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 14, width: 120, backgroundColor: 'var(--color-border)', borderRadius: 2 }} />
                <div style={{ height: 12, width: 180, backgroundColor: 'var(--color-border)', borderRadius: 2 }} />
              </div>
              <div style={{ height: 12, width: 80, backgroundColor: 'var(--color-border)', borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  )
}
