import Image from 'next/image'
import Link from 'next/link'

export function CategorySplit() {
  return (
    <section aria-label="Shop Ethnic and Western">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Ethnic */}
        <div className="relative group overflow-hidden" style={{ minHeight: '440px' }}>
          <Image
            src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
            alt="Ethnic — Sarees, Lehengas, Kurta Sets"
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(15,25,18,0.35)' }}
            aria-hidden="true"
          />
          {/* Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-14">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 7vw, 80px)',
                fontWeight: '400',
                color: 'var(--color-white)',
                letterSpacing: '0.04em',
                lineHeight: 1,
                marginBottom: '12px',
              }}
            >
              ETHNIC
            </h2>
            <Link
              href="/shop/sarees"
              className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: '500',
                letterSpacing: '0.06em',
                color: 'rgba(244,236,223,0.85)',
              }}
            >
              Explore Ethnic
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 5h12M8 1l5 4-5 4" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Western */}
        <div className="relative group overflow-hidden" style={{ minHeight: '440px' }}>
          <Image
            src="https://pub-bd1604488a4e4de8a91122f401a32be2.r2.dev/ui/placeholder.svg"
            alt="Western — Co-Ords, Dresses, Tops, Bottoms"
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(15,25,18,0.3)' }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 md:pb-14">
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(40px, 7vw, 80px)',
                fontWeight: '400',
                color: 'var(--color-white)',
                letterSpacing: '0.04em',
                lineHeight: 1,
                marginBottom: '12px',
              }}
            >
              WESTERN
            </h2>
            <Link
              href="/shop/co-ords"
              className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-70"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: '500',
                letterSpacing: '0.06em',
                color: 'rgba(244,236,223,0.85)',
              }}
            >
              Explore Western
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 5h12M8 1l5 4-5 4" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
