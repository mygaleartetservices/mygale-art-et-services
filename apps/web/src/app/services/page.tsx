import React from 'react'
import Link from 'next/link'
import VitrailMosaic from '@/components/home/VitrailMosaic'
import type { Metadata } from 'next'
import { getPublishedServices } from '@/lib/queries/services'
import { getSiteSettings } from '@/lib/queries/settings'
import { getLocale } from '@/lib/getLocale'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getSiteSettings(), getLocale()])
  const title = locale === 'en' ? settings.defaultSeoTitleEn : settings.defaultSeoTitleFr
  const description =
    locale === 'en' ? settings.defaultSeoDescriptionEn : settings.defaultSeoDescriptionFr

  return {
    title: title || undefined,
    description: description || undefined,
    alternates: { canonical: 'https://www.mygaleartetservices.org/services' },
  }
}

export default async function ServicesIndexPage() {
  const [services, locale] = await Promise.all([getPublishedServices(), getLocale()])
  const isEn = locale === 'en'
  const items = services.map((s) => ({
    slug: s.slug,
    title: isEn ? s.titleEn : s.titleFr,
    summary: (isEn ? s.summaryEn : s.summaryFr) ?? '',
    image: s.heroImage?.url ?? null,
  }))
  // The stained-glass mosaic holds six panes; anything beyond that is listed below it.
  const extra = items.slice(6)

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
        <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:col-span-7">
          {isEn ? 'Six crafts, one studio' : 'Six métiers, un seul atelier'}
        </h1>
        <p className="text-ink-muted lg:col-span-5">
          {isEn
            ? 'Every project is designed and made by the same team in Yaoundé, from the first sketch to installation.'
            : 'Chaque projet est conçu et réalisé par la même équipe à Yaoundé, du premier croquis à la pose.'}
        </p>
      </div>
      <div className="mt-10">
        <VitrailMosaic items={items} cta={isEn ? 'Discover' : 'Découvrir'} />
      </div>
      {extra.length > 0 && (
        <ul className="mt-10 divide-y divide-line border-y border-line">
          {extra.map((item) => (
            <li key={item.slug}>
              <Link href={`/services/${item.slug}`} className="group flex items-baseline justify-between gap-6 py-5">
                <span className="font-display text-xl font-semibold group-hover:text-primary">{item.title}</span>
                <span className="hidden text-sm text-ink-muted sm:block">{item.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
