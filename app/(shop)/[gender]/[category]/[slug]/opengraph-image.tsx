import { ImageResponse } from 'next/og'
import { createPublicClient } from '@/lib/supabase/public'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

interface Props {
  params: { gender: string; category: string; slug: string }
}

async function getOgData(slug: string) {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('products')
      .select('name, price, product_images(url, position)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    if (!data) return null
    const images = ((data.product_images as { url: string; position: number }[]) ?? [])
      .sort((a, b) => a.position - b.position)
    return { name: data.name as string, price: data.price as number, imageUrl: images[0]?.url ?? null }
  } catch {
    return null
  }
}

function formatINR(price: number): string {
  return `₹${price.toLocaleString('en-IN')}`
}

export default async function Image({ params }: Props) {
  const data = await getOgData(params.slug)

  const productName = data?.name ?? 'The Possah'
  const price = data?.price ?? null
  const imageUrl = data?.imageUrl ?? null

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: 1200,
          height: 630,
          background: '#1F3A2D',
          fontFamily: 'serif',
        }}
      >
        {/* Product image — left 55% */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={productName}
            width={660}
            height={630}
            style={{ objectFit: 'cover', objectPosition: 'top center', flexShrink: 0 }}
          />
        )}

        {/* Brand panel — right side */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            padding: '48px 52px',
          }}
        >
          {/* Top — brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontFamily: 'serif',
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: '0.14em',
                color: '#F4ECDF',
                textTransform: 'uppercase',
              }}
            >
              The Possah
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.3em',
                color: '#C99A99',
                textTransform: 'uppercase',
              }}
            >
              Haute Couture
            </span>
          </div>

          {/* Middle — product name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span
              style={{
                fontFamily: 'serif',
                fontSize: productName.length > 30 ? 34 : 42,
                fontWeight: 400,
                color: '#F4ECDF',
                lineHeight: 1.15,
                letterSpacing: '-0.01em',
              }}
            >
              {productName}
            </span>
            {price !== null && (
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 22,
                  color: '#C8973A',
                  letterSpacing: '0.04em',
                }}
              >
                {formatINR(price)}
              </span>
            )}
          </div>

          {/* Bottom — URL */}
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 13,
              letterSpacing: '0.12em',
              color: 'rgba(244,236,223,0.5)',
              textTransform: 'lowercase',
            }}
          >
            thepossah.com
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
