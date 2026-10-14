'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import ServicesSidebar from '@/components/ServicesSidebar'
import type { Lang } from '@/lib/locale'
import type { getServiceBySlug } from '@/lib/queries/services'

type ServiceData = NonNullable<Awaited<ReturnType<typeof getServiceBySlug>>>

function pick(locale: Lang, fr: string | null | undefined, en: string | null | undefined) {
  return (locale === 'en' ? en : fr) ?? fr ?? en ?? ''
}

type Props = {
  service: ServiceData
  locale: Lang
  sidebarServices: { slug: string; titleFr: string; titleEn: string }[]
}

/**
 * ServiceClient (client component)
 * - shows header + supporting image
 * - shows each structured content section with an image (section.media or fallback to hero)
 * - displays a sidebar (ServicesSidebar) with the activeSlug highlighted
 */
export default function ServiceClient({ service, locale, sidebarServices }: Props) {
  const title = pick(locale, service.titleFr, service.titleEn)
  const desc = pick(locale, service.summaryFr, service.summaryEn)
  const heroImg = service.heroImage?.url ?? '/hero-bg.jpg'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35 }}
      className="max-w-6xl mx-auto px-4 py-16"
    >
      {/* Breadcrumbs */}
      <nav className="text-sm text-ink-muted mb-6">
        <Link href="/" className="hover:underline">
          {locale === 'fr' ? 'Accueil' : 'Home'}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/services" className="hover:underline">
          {locale === 'fr' ? 'Nos services' : 'Our services'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-muted">{title}</span>
      </nav>

      {/* Main layout: content + sidebar */}
      <div className="md:grid md:grid-cols-[1fr_300px] md:gap-8">
        {/* Content column */}
        <div>
          {/* Header area: on desktop text left, image right; on mobile image below header */}
          <div className="mb-8">
            <div className="md:flex md:items-start md:gap-6">
              <div className="md:flex-1">
                <h1 className="text-4xl font-bold text-ink mb-4">{title}</h1>
                <p className="text-ink-muted leading-relaxed">{desc}</p>
              </div>

              {/* supporting image on right (desktop) / below on mobile */}
              <div className="mt-6 md:mt-0 md:w-80 md:shrink-0">
                <Image
                  src={heroImg}
                  alt={title}
                  width={900}
                  height={600}
                  className="w-full h-48 md:h-56 object-cover rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {service.sections.map((block) => {
              const blockTitle = pick(locale, block.titleFr, block.titleEn)
              const blockItems = locale === 'en' ? block.itemsEn : block.itemsFr
              const blockImg = block.media?.url || heroImg

              return (
                <div key={block.id} className="md:grid md:grid-cols-2 md:gap-6 items-start">
                  {/* text */}
                  <div>
                    <h2 className="text-2xl font-semibold text-ink mb-3">{blockTitle}</h2>
                    {block.type === 'BULLET_LIST' ? (
                      <ul className="list-disc list-inside text-ink-muted space-y-1">
                        {blockItems.map((it, idx) => (
                          <li key={idx}>{it}</li>
                        ))}
                      </ul>
                    ) : (
                      <div
                        className="prose prose-sm max-w-none text-ink-muted leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: pick(locale, block.bodyFr, block.bodyEn),
                        }}
                      />
                    )}
                  </div>

                  {/* image (appears below on small screens, right on md+) */}
                  <div className="mt-4 md:mt-0">
                    <Image
                      src={blockImg}
                      alt={`${title} - ${blockTitle}`}
                      width={900}
                      height={600}
                      className="w-full h-full md:h-40 object-cover rounded-lg"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="mt-10 md:mt-0">
          <ServicesSidebar activeSlug={service.slug} services={sidebarServices} locale={locale} />
        </aside>
      </div>
    </motion.div>
  )
}
