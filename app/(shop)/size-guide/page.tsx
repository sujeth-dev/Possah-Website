import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Size Guide — The Possah',
  description: 'Find your perfect fit with The Possah\'s size guide for sarees, lehengas, co-ords and more.',
  alternates: { canonical: 'https://thepossah.com/size-guide' },
}

const WOMEN_SIZES = [
  { size: 'XS',  bust: '32–33', waist: '25–26', hip: '35–36', length: '38–39' },
  { size: 'S',   bust: '34–35', waist: '27–28', hip: '37–38', length: '39–40' },
  { size: 'M',   bust: '36–37', waist: '29–30', hip: '39–40', length: '40–41' },
  { size: 'L',   bust: '38–40', waist: '31–33', hip: '41–43', length: '41–42' },
  { size: 'XL',  bust: '41–43', waist: '34–36', hip: '44–46', length: '42–43' },
  { size: '2XL', bust: '44–46', waist: '37–39', hip: '47–49', length: '43–44' },
  { size: '3XL', bust: '47–49', waist: '40–42', hip: '50–52', length: '44–45' },
]

const MEASUREMENT_TIPS = [
  {
    label: 'BUST',
    tip: 'Measure around the fullest part of your bust, keeping the tape parallel to the floor. Wear a well-fitting bra.',
  },
  {
    label: 'WAIST',
    tip: 'Measure around your natural waistline — the narrowest part of your torso, just above your navel.',
  },
  {
    label: 'HIPS',
    tip: 'Measure around the fullest part of your hips and seat, approximately 7–9 inches below your waistline.',
  },
  {
    label: 'LENGTH',
    tip: 'Measure from your shoulder (or the natural starting point for that garment) down to where you want the hem to fall.',
  },
]

export default function SizeGuidePage() {
  return (
    <div className="container-site py-16 pb-24">
      <p className="section-label mb-4">FIT</p>
      <h1
        className="mb-12"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(32px, 5vw, 64px)',
          fontWeight: '400',
          color: 'var(--color-text)',
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
        }}
      >
        Size Guide
      </h1>

      <div className="grid md:grid-cols-[1fr_340px] gap-12 lg:gap-20">
        {/* Table */}
        <div>
          <p
            className="mb-4"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            All measurements in inches
          </p>
          <div className="overflow-x-auto" style={{ borderRadius: 'var(--radius-card)' }}>
            <table
              className="w-full"
              style={{
                borderCollapse: 'collapse',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--color-green)' }}>
                  {['SIZE', 'BUST', 'WAIST', 'HIPS', 'LENGTH'].map((h) => (
                    <th
                      key={h}
                      className="py-3 px-4 text-left"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        letterSpacing: '0.16em',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WOMEN_SIZES.map((row, i) => (
                  <tr
                    key={row.size}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(31,58,45,0.02)',
                    }}
                  >
                    <td
                      className="py-3 px-4"
                      style={{ fontWeight: '600', color: 'var(--color-text)' }}
                    >
                      {row.size}
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--color-text-muted)' }}>{row.bust}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--color-text-muted)' }}>{row.waist}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--color-text-muted)' }}>{row.hip}</td>
                    <td className="py-3 px-4" style={{ color: 'var(--color-text-muted)' }}>{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p
            className="mt-4"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            Not sure? When between sizes, size up for blouses and size down for skirts. If your measurements fall outside our standard range, our Made-to-Measure service is the right choice.
          </p>
        </div>

        {/* How to measure */}
        <div className="flex flex-col gap-6">
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-green)',
            }}
          >
            HOW TO MEASURE
          </p>
          {MEASUREMENT_TIPS.map(({ label, tip }) => (
            <div
              key={label}
              className="flex flex-col gap-1.5 pb-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text)',
                }}
              >
                {label}
              </span>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  lineHeight: 1.7,
                  color: 'var(--color-text-muted)',
                }}
              >
                {tip}
              </p>
            </div>
          ))}

          <div
            className="p-4"
            style={{
              backgroundColor: 'rgba(200, 151, 58, 0.06)',
              border: '1px solid rgba(200, 151, 58, 0.3)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                lineHeight: 1.7,
                color: 'var(--color-text)',
              }}
            >
              <strong>Tip:</strong> Always measure over your undergarments, not over clothing. Use a soft measuring tape and don&rsquo;t pull it too tight.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
