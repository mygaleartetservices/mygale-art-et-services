'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Lang } from '@/lib/locale'
import { whatsappLink } from '@/lib/whatsapp'
import { EASE_OUT, fadeLeft, fadeRight, fadeUp, maskWord } from '@/lib/animations'
import VitrailWindow from '@/components/home/VitrailWindow'
import VitrailMosaic from '@/components/home/VitrailMosaic'
import type { getSiteSettings } from '@/lib/queries/settings'
import type { getHomepageSections } from '@/lib/queries/homepage'
import type { getFeaturedServices } from '@/lib/queries/services'

type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>
type HomepageSection = Awaited<ReturnType<typeof getHomepageSections>>[number]
type FeaturedService = Awaited<ReturnType<typeof getFeaturedServices>>[number]

function pick(locale: Lang, fr: string | null | undefined, en: string | null | undefined) {
  return (locale === 'en' ? en : fr) ?? fr ?? en ?? ''
}

// UI chrome only; page content comes from the CMS. Written natively in both
// languages (UX-10): French first, French typography (non-breaking spaces).
const COPY = {
  fr: {
    whatsapp: 'Écrire sur WhatsApp',
    services: 'Voir les services',
    channels: 'WhatsApp, e-mail ou passage à l’atelier, à Yaoundé.',
    servicesIntro: 'Six métiers, un seul atelier. Choisissez par où commencer.',
    discover: 'Découvrir',
    visit: 'Nous rendre visite',
    write: 'Nous écrire',
    ctaTitle: 'Un projet en tête ? Parlons-en.',
    ctaBody: 'Envoyez une photo, un plan ou deux lignes. Nous revenons vers vous avec les prochaines étapes.',
    contact: 'Formulaire de contact',
    openMaps: 'Ouvrir dans Google Maps',
  },
  en: {
    whatsapp: 'Message us on WhatsApp',
    services: 'See the services',
    channels: 'WhatsApp, email or a visit to the studio in Yaoundé.',
    servicesIntro: 'Six crafts, one studio. Pick where to start.',
    discover: 'Discover',
    visit: 'Visit us',
    write: 'Write to us',
    ctaTitle: 'Have a project in mind? Let’s talk.',
    ctaBody: 'Send a photo, a plan or two lines. We come back to you with the next steps.',
    contact: 'Contact form',
    openMaps: 'Open in Google Maps',
  },
} as const

function RevealBlock({
  children,
  className,
  variant = fadeUp,
}: {
  children: React.ReactNode
  className?: string
  variant?: typeof fadeUp
}) {
  return (
    <motion.div
      className={className}
      variants={variant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </motion.div>
  )
}

export default function HomeClient({
  settings,
  sections,
  services,
  locale,
}: {
  settings: SiteSettings
  sections: HomepageSection[]
  services: FeaturedService[]
  locale: Lang
}) {
  const copy = COPY[locale]
  const wa = whatsappLink(settings.whatsapp, locale)
  const address = (locale === 'en' ? settings.addressEn : settings.addressFr) || settings.city

  return (
    <div className="bg-canvas text-ink">
      {sections.map((section) => {
        if (section.type === 'HERO') {
          const title = pick(locale, section.titleFr, section.titleEn)
          const words = title.split(' ')
          const image = section.media?.url || '/hero-bg.jpg'
          const enter = (delay: number) => ({
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay } },
          })
          return (
            <section key={section.id} aria-label="Hero" className="relative overflow-hidden">
              <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-12 lg:items-center lg:gap-8 lg:pb-28">
                <div className="lg:col-span-7">
                  <h1 className="font-display text-[2.2rem] font-bold leading-[1.06] sm:text-5xl lg:text-[3.1rem]">
                    {words.map((word, i) => (
                      <span key={`${word}-${i}`}>
                        <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                          <motion.span
                            className="inline-block"
                            variants={maskWord}
                            initial="hidden"
                            animate="visible"
                            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.05 * i }}
                          >
                            {word}
                          </motion.span>
                        </span>
                        {i < words.length - 1 ? ' ' : null}
                      </span>
                    ))}
                  </h1>
                  <motion.p {...enter(0.15)} className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
                    {pick(locale, section.subtitleFr, section.subtitleEn)}
                  </motion.p>
                  <motion.div {...enter(0.28)} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                    {wa ? (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary text-base">
                        {copy.whatsapp}
                      </a>
                    ) : (
                      <Link href={section.ctaHref || '/contact'} className="btn-primary text-base">
                        {pick(locale, section.ctaLabelFr, section.ctaLabelEn)}
                      </Link>
                    )}
                    <a
                      href="#services"
                      className="font-semibold text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-primary"
                    >
                      {copy.services}
                    </a>
                  </motion.div>
                  <motion.p {...enter(0.38)} className="mt-5 text-sm text-ink-muted">
                    {copy.channels}
                  </motion.p>
                </div>
                <div className="lg:col-span-5">
                  <VitrailWindow src={image} alt={title} />
                </div>
              </div>
            </section>
          )
        }

        if (section.type === 'SERVICES_GRID') {
          return (
            <section key={section.id} id="services" className="border-t border-line py-20 sm:py-28">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
                  <RevealBlock variant={fadeRight} className="lg:col-span-7">
                    <h2 className="font-display text-3xl font-bold sm:text-4xl">
                      {pick(locale, section.titleFr, section.titleEn)}
                    </h2>
                  </RevealBlock>
                  <RevealBlock variant={fadeLeft} className="lg:col-span-5">
                    <p className="text-ink-muted">{copy.servicesIntro}</p>
                  </RevealBlock>
                </div>
                <div className="mt-10">
                  <VitrailMosaic
                    cta={copy.discover}
                    items={services.map((s) => ({
                      slug: s.slug,
                      title: pick(locale, s.titleFr, s.titleEn),
                      summary: pick(locale, s.summaryFr, s.summaryEn),
                      image: s.heroImage?.url ?? null,
                    }))}
                  />
                </div>
              </div>
            </section>
          )
        }

        if (section.type === 'ABOUT') {
          return (
            <section key={section.id} className="bg-surface py-20 sm:py-28">
              <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12">
                <RevealBlock variant={fadeRight} className="lg:col-span-4">
                  <h2 className="font-display text-3xl font-bold sm:text-4xl">
                    {pick(locale, section.titleFr, section.titleEn)}
                  </h2>
                </RevealBlock>
                <RevealBlock variant={fadeLeft} className="lg:col-span-7 lg:col-start-6">
                  <p className="text-xl leading-relaxed text-ink sm:text-2xl sm:leading-snug">
                    {pick(locale, section.bodyFr, section.bodyEn)}
                  </p>
                  <Link
                    href="/about"
                    className="mt-6 inline-block font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {locale === 'en' ? 'Our story' : 'Notre histoire'}
                  </Link>
                </RevealBlock>
              </div>
            </section>
          )
        }

        if (section.type === 'MAP') {
          return (
            <section key={section.id} id="location" className="py-20 sm:py-28">
              <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:items-center">
                <RevealBlock variant={fadeRight} className="lg:col-span-5">
                  <h2 className="font-display text-3xl font-bold sm:text-4xl">
                    {pick(locale, section.titleFr, section.titleEn)}
                  </h2>
                  <dl className="mt-8 divide-y divide-line border-y border-line">
                    {address ? (
                      <div className="py-4">
                        <dt className="text-sm text-ink-muted">{copy.visit}</dt>
                        <dd className="mt-1 font-semibold">{address}</dd>
                      </div>
                    ) : null}
                    {settings.emailPrimary ? (
                      <div className="py-4">
                        <dt className="text-sm text-ink-muted">{copy.write}</dt>
                        <dd className="mt-1">
                          <a href={`mailto:${settings.emailPrimary}`} className="font-semibold break-words hover:text-primary">
                            {settings.emailPrimary}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  {settings.mapPlaceUrl ? (
                    <a
                      href={settings.mapPlaceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-block font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {pick(locale, section.ctaLabelFr, section.ctaLabelEn) || copy.openMaps}
                    </a>
                  ) : null}
                </RevealBlock>
                {settings.mapEmbedUrl ? (
                  <RevealBlock variant={fadeLeft} className="lg:col-span-7">
                    <div className="h-[340px] w-full overflow-hidden rounded-card border border-line shadow-soft md:h-[440px]">
                      <iframe
                        src={settings.mapEmbedUrl}
                        title={locale === 'en' ? 'Mygale Art & Services on the map' : 'Mygale Art et Services sur la carte'}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </RevealBlock>
                ) : null}
              </div>
            </section>
          )
        }

        return null
      })}

      {/* Closing band: one primary action (WhatsApp) and a calm alternative. */}
      <section className="bg-ink py-20 text-surface sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:items-end">
          <RevealBlock variant={fadeRight} className="lg:col-span-7">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">{copy.ctaTitle}</h2>
            <p className="mt-4 max-w-xl text-surface/75">{copy.ctaBody}</p>
          </RevealBlock>
          <RevealBlock variant={fadeLeft} className="flex flex-col gap-4 lg:col-span-5 lg:items-end">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary text-base">
                {copy.whatsapp}
              </a>
            ) : null}
            <Link href="/contact" className="text-sm font-semibold text-surface/80 underline-offset-4 hover:text-surface hover:underline">
              {copy.contact}
            </Link>
          </RevealBlock>
        </div>
      </section>
    </div>
  )
}
