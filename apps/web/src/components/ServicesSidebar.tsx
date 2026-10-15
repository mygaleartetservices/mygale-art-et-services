/* apps/web/src/components/ServicesSidebar.tsx */
'use client'

import React from 'react'
import Link from 'next/link'
import type { Lang } from '@/lib/locale'

type Props = {
  activeSlug?: string
  services: { slug: string; titleFr: string; titleEn: string }[]
  locale: Lang
}

export default function ServicesSidebar({ activeSlug, services, locale }: Props) {
  const title = locale === 'en' ? 'Our services' : 'Nos services'
  const tagline =
    locale === 'en'
      ? 'Discover our experience, past projects and tailor-made solutions for each service.'
      : 'Découvrez nos expériences, projets passés et solutions sur-mesure pour chaque service.'

  return (
    <div className="sticky top-24 p-4 border rounded-lg bg-surface">
      <h4 className="text-sm font-semibold text-ink-muted mb-3">{title}</h4>

      <ul className="space-y-2 text-sm">
        {services.map((s) => {
          const label = locale === 'en' ? s.titleEn : s.titleFr
          const active = activeSlug === s.slug
          return (
            <li key={s.slug}>
              <Link
                href={`/services/${s.slug}`}
                className={`block px-3 py-2 rounded ${active ? 'bg-primary text-white' : 'text-ink-muted hover:bg-canvas'}`}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 text-xs text-ink-muted">{tagline}</div>
    </div>
  )
}
