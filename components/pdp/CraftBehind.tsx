import Image from 'next/image'

interface CraftBehindProps {
  craftStory: string
  imageUrl?: string
  productName: string
}

export function CraftBehind({ craftStory, imageUrl, productName }: CraftBehindProps) {
  return (
    <section
      className="section-gap border-t"
      style={{ borderColor: 'var(--color-border)' }}
      aria-label="The craft behind this piece"
    >
      <div className="container-site">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Text */}
          <div className="flex flex-col gap-6">
            <p
              className="section-label"
              style={{ color: 'var(--color-text-muted)' }}
            >
              THE CRAFT
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 48px)',
                fontWeight: '400',
                color: 'var(--color-text)',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
              }}
            >
              Every thread,<br />a deliberate choice.
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                lineHeight: 1.8,
                color: 'var(--color-text-muted)',
                maxWidth: '480px',
              }}
            >
              {craftStory}
            </p>
          </div>

          {/* Image */}
          {imageUrl && (
            <div
              className="relative aspect-square w-full overflow-hidden"
              style={{ borderRadius: 'var(--radius-card)' }}
            >
              <Image
                src={imageUrl}
                alt={`Craft behind ${productName}`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
