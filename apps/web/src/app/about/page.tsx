import React from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { getAboutPage } from '@/lib/queries/about'
import { getLocale } from '@/lib/getLocale'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const [about, locale] = await Promise.all([getAboutPage(), getLocale()])
  if (!about) return {}

  const title = (locale === 'en' ? about.seoTitleEn : about.seoTitleFr) || undefined
  const description = (locale === 'en' ? about.seoDescriptionEn : about.seoDescriptionFr) || undefined

  return {
    title,
    description,
    alternates: { canonical: 'https://www.mygaleartetservices.org/about' },
  }
}

export default async function AboutPage() {
  const [about, locale] = await Promise.all([getAboutPage(), getLocale()])

  if (!about) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-ink-muted">{locale === 'en' ? 'This page is being written.' : 'Cette page est en cours de rédaction.'}</p>
      </div>
    )
  }

  const title = locale === 'en' ? about.titleEn : about.titleFr
  const intro = locale === 'en' ? about.introEn : about.introFr
  const body = locale === 'en' ? about.bodyEn : about.bodyFr

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-5xl">{title}</h1>
          <p className="mt-6 text-xl leading-relaxed text-ink">{intro}</p>
        </div>
        {about.heroImage?.url ? (
          <div className="relative aspect-4/5 overflow-hidden rounded-t-full border-[10px] border-ink lg:col-span-4 lg:col-start-9">
            {/* An arched frame, echoing the stained-glass window on the home page. */}
            <Image src={about.heroImage.url} alt={title} fill sizes="(min-width: 1024px) 360px, 90vw" className="object-cover" priority />
          </div>
        ) : null}
      </div>

      {/* Body HTML is sanitised on save (admin/about/actions.ts). */}
      <div
        className="prose prose-lg mt-14 max-w-3xl text-ink prose-headings:font-display prose-headings:text-ink prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  )
}
