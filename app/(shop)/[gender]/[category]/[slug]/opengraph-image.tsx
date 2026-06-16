import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 3600

interface Props {
  params: { gender: string; category: string; slug: string }
}

async function getOgData(slug: string) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null

    const res = await fetch(
      `${url}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=name,price,product_images(url,position)&limit=1`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return null
    const rows = await res.json() as { name: string; price: number; product_images: { url: string; position: number }[] }[]
    const row = rows[0]
    if (!row) return null
    const images = (row.product_images ?? []).sort((a, b) => a.position - b.position)
    return { name: row.name, price: row.price, imageUrl: images[0]?.url ?? null }
  } catch {
    return null
  }
}

function formatINR(price: number): string {
  const s = String(Math.round(price))
  const last3 = s.slice(-3)
  const rest = s.slice(0, -3)
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3
  return '₹' + grouped
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
