import { formatDistanceToNow } from 'date-fns'

interface Review {
  id: string
  reviewer_name: string
  rating: number
  body: string
  created_at: string
}

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number
  totalCount: number
}

function StarIcon({ filled, half = false }: { filled: boolean; half?: boolean }) {
  if (half) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <defs>
          <linearGradient id="half-fill">
            <stop offset="50%" stopColor="var(--color-gold)" />
            <stop offset="50%" stopColor="var(--color-border)" />
          </linearGradient>
        </defs>
        <path
          d="M7 1l1.545 3.09L12 4.635l-2.5 2.44.59 3.43L7 8.775 3.91 10.505 4.5 7.075 2 4.635l3.455-.545L7 1z"
          fill="url(#half-fill)"
        />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1l1.545 3.09L12 4.635l-2.5 2.44.59 3.43L7 8.775 3.91 10.505 4.5 7.075 2 4.635l3.455-.545L7 1z"
        fill={filled ? 'var(--color-gold)' : 'var(--color-border)'}
      />
    </svg>
  )
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {Array.from({ length: 5 }, (_, i) => {
        if (i < full) return <StarIcon key={i} filled />
        if (i === full && half) return <StarIcon key={i} filled half />
        return <StarIcon key={i} filled={false} />
      })}
    </div>
  )
}

function RatingBar({ count, total, value }: { count: number; total: number; value: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: 'var(--color-text-muted)',
          minWidth: 8,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${count} reviews with ${value} stars`}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: 'var(--color-gold)',
            borderRadius: 'inherit',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.1em',
          color: 'var(--color-text-muted)',
          minWidth: 24,
        }}
      >
        ({count})
      </span>
    </div>
  )
}

export function ReviewsSection({ reviews, averageRating, totalCount }: ReviewsSectionProps) {
  if (totalCount === 0) return null

  // Count per star level
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    value: star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }))

  return (
    <section
      className="section-gap border-t"
      style={{ borderColor: 'var(--color-border)' }}
      aria-label="Customer reviews"
    >
      <div className="container-site">
        <div className="flex items-baseline justify-between mb-10">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(22px, 3vw, 36px)',
              fontWeight: '400',
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            What she said
          </h2>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-10 lg:gap-16">
          {/* Summary panel */}
          <div className="flex flex-col gap-5">
            <div className="flex items-end gap-3">
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '56px',
                  fontWeight: '400',
                  color: 'var(--color-text)',
                  lineHeight: 1,
                }}
              >
                {averageRating.toFixed(1)}
              </span>
              <div className="flex flex-col gap-1 pb-1">
                <StarRow rating={averageRating} />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {totalCount} {totalCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {distribution.map(({ value, count }) => (
                <RatingBar key={value} value={value} count={count} total={totalCount} />
              ))}
            </div>
          </div>

          {/* Review list */}
          <div className="flex flex-col gap-8">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="flex flex-col gap-3 pb-8 border-b last:border-b-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'var(--color-text)',
                        }}
                      >
                        {review.reviewer_name}
                      </span>
                    </div>
                    <StarRow rating={review.rating} />
                  </div>
                  <time
                    dateTime={review.created_at}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </time>
                </div>
                {review.body && (
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      lineHeight: 1.75,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {review.body}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
