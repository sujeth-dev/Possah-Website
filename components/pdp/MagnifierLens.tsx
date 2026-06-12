'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

interface MagnifierLensProps {
  src:      string
  onClick?: () => void
  children: React.ReactNode
}

const PANEL_W = 300
const PANEL_H = 400
const ZOOM    = 2.5

export function MagnifierLens({ src, onClick, children }: MagnifierLensProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef       = useRef<number | null>(null)

  const [mounted,  setMounted]  = useState(false)
  const [canHover, setCanHover] = useState(false)
  const [panel, setPanel] = useState<{
    visible: boolean
    panelX:  number
    panelY:  number
    bgX:     number
    bgY:     number
  }>({ visible: false, panelX: 0, panelY: 0, bgX: 0, bgY: 0 })

  useEffect(() => {
    setMounted(true)
    setCanHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()

      const pctX = Math.max(0, Math.min(1, (e.clientX - rect.left)  / rect.width))
      const pctY = Math.max(0, Math.min(1, (e.clientY - rect.top)   / rect.height))

      const vpW = window.innerWidth
      const vpH = window.innerHeight

      let panelX = rect.right + 16
      if (panelX + PANEL_W > vpW - 8) panelX = rect.left - PANEL_W - 16
      const panelY = Math.max(8, Math.min(vpH - PANEL_H - 8, e.clientY - PANEL_H / 2))

      setPanel({ visible: true, panelX, panelY, bgX: pctX * 100, bgY: pctY * 100 })
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPanel((p) => ({ ...p, visible: false }))
  }, [])

  const portal = mounted && canHover && panel.visible
    ? createPortal(
        <div
          aria-hidden="true"
          style={{
            position:           'fixed',
            left:               panel.panelX,
            top:                panel.panelY,
            width:              PANEL_W,
            height:             PANEL_H,
            backgroundImage:    `url(${src})`,
            backgroundSize:     `${ZOOM * 100}%`,
            backgroundPosition: `${panel.bgX}% ${panel.bgY}%`,
            backgroundRepeat:   'no-repeat',
            border:             '1px solid rgba(0,0,0,0.12)',
            borderRadius:       '6px',
            boxShadow:          '0 8px 32px rgba(0,0,0,0.18)',
            zIndex:             9998,
            pointerEvents:      'none',
          }}
        />,
        document.body,
      )
    : null

  return (
    <>
      <div
        ref={containerRef}
        onMouseMove={canHover ? handleMouseMove : undefined}
        onMouseLeave={canHover ? handleMouseLeave : undefined}
        onClick={onClick}
        style={{ cursor: canHover ? 'crosshair' : 'zoom-in' }}
      >
        {children}
      </div>
      {portal}
    </>
  )
}
