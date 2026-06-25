'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0, 0.25, 1] as [number, number, number, number] } },
}

interface AnimatedGridProps {
  className?: string
  children: ReactNode
  role?: string
  'aria-label'?: string
}

/**
 * Wraps a product grid with staggered fade-up entrance.
 * Each direct child receives the item variant automatically.
 *
 * Usage:
 *   <AnimatedGrid className="grid grid-cols-2 ...">
 *     {products.map(p => <ProductCard key={p.id} product={p} />)}
 *   </AnimatedGrid>
 */
export function AnimatedGrid({ className, children, role, 'aria-label': ariaLabel }: AnimatedGridProps) {
  return (
    <motion.div
      className={className}
      role={role}
      aria-label={ariaLabel}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  )
}

/**
 * Individual animated grid cell. Wrap each ProductCard with this.
 */
export function AnimatedGridItem({ children, className, role }: { children: ReactNode; className?: string; role?: string }) {
  return (
    <motion.div className={className} role={role} variants={item}>
      {children}
    </motion.div>
  )
}
