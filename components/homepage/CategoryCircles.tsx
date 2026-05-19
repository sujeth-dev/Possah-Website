import Image from 'next/image'
import Link from 'next/link'

const CATEGORIES = [
  { label: 'SAREES',    href: '/shop/sarees',     image: '/images/placeholder-cat-sarees.jpg'    },
  { label: 'LEHENGAS',  href: '/shop/lehengas',   image: '/images/placeholder-cat-lehengas.jpg'  },
  { label: 'CO-ORDS',   href: '/shop/co-ords',    image: '/images/placeholder-cat-coords.jpg'    },
  { label: 'DRESSES',   href: '/shop/dresses',    image: '/images/placeholder-cat-dresses.jpg'   },
  { label: 'KURTA SETS',href: '/shop/kurta-sets', image: '/images/placeholder-cat-kurtas.jpg'    },
  { label: 'SEPARATES', href: '/shop/separates',  image: '/images/placeholder-cat-separates.jpg' },
]

export function CategoryCircles() {
  return (
    <section className="section-gap" aria-label="Shop by Category">
      <div className="container-site">
        {/* Heading */}
        <h2
          className="text-center mb-10 md:mb-14"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: '400',
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Shop by Category
        </h2>

        {/* Category circles */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="flex flex-col items-center gap-3 group"
              aria-label={`Shop ${cat.label}`}
            >
              {/* Circle */}
              <div
                className="relative w-full overflow-hidden"
                style={{
                  borderRadius: '50%',
                  aspectRatio: '1',
                  backgroundColor: 'var(--color-border)',
                }}
              >
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
                  sizes="(max-width: 768px) 30vw, 15vw"
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text)',
                  textAlign: 'center',
                }}
              >
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
