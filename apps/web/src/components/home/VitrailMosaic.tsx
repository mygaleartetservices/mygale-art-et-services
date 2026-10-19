'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { EASE_OUT } from '@/lib/animations'

export type MosaicItem = { slug: string; title: string; summary: string; image: string | null }

// Irregular stained-glass layout: one large pane, a tall narrow one, wide
// and small panes, separated by thick ink "lead" lines (the grid gap).
// Areas are defined in globals.css (.vitrail-grid).
const AREAS = ['a', 'b', 'c', 'd', 'e', 'f'] as const
const TINTS = [
  'var(--glass-cobalt)',
  'var(--glass-amber)',
  'var(--glass-ruby)',
  'var(--glass-emerald)',
  'var(--glass-amber)',
  'var(--glass-cobalt)',
]

// Panes uncover bottom-up in reading order. The observer sits on the grid,
// not on each pane: a pane clipped to nothing never reports as visible.
const pane: Variants = {
  hidden: { opacity: 0, clipPath: 'inset(100% 0% 0% 0%)' },
  visible: (i: number) => ({
    opacity: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: { duration: 0.7, ease: EASE_OUT, delay: i * 0.08 },
  }),
}

export default function VitrailMosaic({ items, cta }: { items: MosaicItem[]; cta: string }) {
  return (
    <div className="rounded-card bg-ink p-2.5 sm:p-3">
      <motion.div
        className="vitrail-grid grid gap-2.5 sm:gap-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        {items.slice(0, 6).map((item, i) => (
          <motion.div key={item.slug} style={{ gridArea: AREAS[i] }} custom={i} variants={pane} className="min-h-[13rem]">
            <Link href={`/services/${item.slug}`} className="group relative block h-full overflow-hidden rounded-pane bg-ink-muted">
              {item.image && (
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 40vw, 92vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              )}
              {/* Light through coloured glass on hover or keyboard focus. */}
              <span
                className="absolute inset-0 opacity-0 mix-blend-multiply transition-opacity duration-300 group-hover:opacity-45 group-focus-visible:opacity-45"
                style={{ background: TINTS[i] }}
                aria-hidden="true"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 via-ink/40 to-transparent p-4 pt-14 sm:p-5 sm:pt-16">
                <span className="block font-display text-lg font-semibold text-surface transition-transform duration-300 group-hover:-translate-y-1.5 sm:text-xl">
                  {item.title}
                </span>
                <span className="mt-1 line-clamp-2 max-w-md text-sm text-surface/80">{item.summary}</span>
                <span className="mt-3 inline-block text-sm font-semibold text-surface underline decoration-surface/40 underline-offset-4 group-hover:decoration-surface">
                  {cta}
                </span>
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
