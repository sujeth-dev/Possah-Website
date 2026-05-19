import Image from 'next/image'
import Link from 'next/link'
import type { OccasionTile } from '@/app/(shop)/page'

interface OccasionGridProps {
  tiles: OccasionTile[]
}

export function OccasionGrid({ tiles }: OccasionGridProps) {
  return (
    <section className="section-gap" aria-label="Shop by occasion">
      <div className="container-site">
        {/* Heading — quote style, from design */}
        <h2
          className="text-center mb-10 md:mb-14"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(26px, 4vw, 52px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          &lsquo;Where will you wear it?&rsquo;
        </h2>

        {/* 2×4 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {tiles.map((tile) => (
            <Link
              key={tile.id}
              href={tile.link}
              className="relative group overflow-hidden block"
              style={{
                aspectRatio: '3 / 4',
                borderRadius: 'var(--radius-card)',
              }}
              aria-label={`Shop ${tile.label} looks`}
            >
              <Image
                src={tile.image}
                alt={tile.label}
                fill
                className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 50vw, 25vw"
              />

              {/* Dark gradient — bottom */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(15,25,18,0.65) 0%, rgba(15,25,18,0.1) 50%, transparent 100%)',
                }}
                aria-hidden="true"
              />

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--color-white)',
                    fontWeight: '400',
                  }}
                >
                  {tile.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
