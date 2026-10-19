'use client'

import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { EASE_OUT } from '@/lib/animations'

// One photograph seen through an arched stained-glass lattice. Panes flash
// their glass tint in sequence as the lead lines draw, then keep a faint
// tint: the brand's signature (DESIGN.md).
const ARCH = 'M0 560 V200 A200 200 0 0 1 400 200 V560 Z'
const PANES: { d: string; tint: string }[] = [
  { d: 'M0 200 A200 200 0 0 1 200 0 V200 Z', tint: 'var(--glass-cobalt)' },
  { d: 'M200 0 A200 200 0 0 1 400 200 H200 Z', tint: 'var(--glass-amber)' },
  { d: 'M0 200 H200 V380 H0 Z', tint: 'var(--glass-emerald)' },
  { d: 'M200 200 H400 V380 H200 Z', tint: 'var(--glass-ruby)' },
  { d: 'M0 380 H140 V560 H0 Z', tint: 'var(--glass-amber)' },
  { d: 'M140 380 H400 V560 H140 Z', tint: 'var(--glass-cobalt)' },
]
const LEADS = ['M200 0 V166', 'M200 234 V380', 'M0 200 H166', 'M234 200 H400', 'M0 380 H400', 'M140 380 V560']

export default function VitrailWindow({ src, alt }: { src: string; alt: string }) {
  const reduce = useReducedMotion()
  const [desktop, setDesktop] = useState(false)
  const { scrollY } = useScroll()
  const drift = useTransform(scrollY, [0, 700], [0, 60])

  useEffect(() => {
    const q = window.matchMedia('(min-width: 1024px)')
    const update = () => setDesktop(q.matches)
    update()
    q.addEventListener('change', update)
    return () => q.removeEventListener('change', update)
  }, [])

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[20rem] sm:max-w-[26rem]"
      style={desktop && !reduce ? { y: drift } : undefined}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT, delay: 0.2 } }}
    >
      {/* The photo sits under the SVG lattice and is clipped to the arch by an
          SVG clipPath, so next/image keeps its optimisation. */}
      <div className="relative aspect-[400/560] w-full">
        <div className="absolute inset-0 [clip-path:url(#vitrail-arch-clip)]">
          <Image src={src} alt={alt} fill priority sizes="(min-width: 1024px) 420px, 90vw" className="object-cover" />
        </div>
        <svg viewBox="0 0 400 560" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <clipPath id="vitrail-arch-clip" clipPathUnits="objectBoundingBox">
              <path d="M0 1 V0.357 A0.5 0.357 0 0 1 1 0.357 V1 Z" />
            </clipPath>
          </defs>
          {PANES.map((pane, i) => (
            <motion.path
              key={i}
              d={pane.d}
              fill={pane.tint}
              style={{ mixBlendMode: 'multiply' }}
              initial={{ opacity: 0.85 }}
              animate={{
                opacity: 0.16,
                transition: { duration: reduce ? 0 : 0.9, ease: EASE_OUT, delay: reduce ? 0 : 0.5 + i * 0.14 },
              }}
            />
          ))}
          {/* Lead lines (the "came") and the rosette that echoes the spider's body. */}
          <g fill="none" stroke="var(--ink)" strokeWidth="10" strokeLinecap="round">
            {LEADS.map((d, i) => (
              <motion.path
                key={d}
                d={d}
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: 1,
                  transition: { duration: reduce ? 0 : 0.7, ease: EASE_OUT, delay: reduce ? 0 : 0.3 + i * 0.08 },
                }}
              />
            ))}
            <circle cx="200" cy="200" r="34" />
            <path d={ARCH} strokeWidth="14" />
          </g>
        </svg>
      </div>
    </motion.div>
  )
}
