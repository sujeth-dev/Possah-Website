'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Delay before the animation starts, in seconds. Default 0. */
  delay?: number
  /** How far (px) the element needs to enter the viewport before triggering. Default -80px (triggers 80px before fully visible). */
  margin?: string
}

/**
 * Wraps children in a fade-up entrance animation that triggers once when
 * the element scrolls into view. Server-component-safe: import in any
 * homepage section and wrap the outer <section> element.
 *
 * Usage:
 *   <Reveal>
 *     <section className="section-gap">...</section>
 *   </Reveal>
 */
export function Reveal({ children, className, delay = 0, margin = '-80px' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: margin as `${number}px` })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0, 0.25, 1], delay }}
    >
      {children}
    </motion.div>
  )
}
