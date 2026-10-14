import '../styles/globals.css'
import React, { Suspense } from 'react'
import type { Metadata } from 'next'
import { Instrument_Sans, Unbounded } from 'next/font/google'
import { LocaleProvider } from '@/lib/locale'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MotionProvider from '@/components/motion/MotionProvider'
import SmoothScroll from '@/components/motion/SmoothScroll'
import RouteProgress from '@/components/motion/RouteProgress'
import { Analytics } from '@vercel/analytics/next'
import AnnouncementBanner from '@/components/AnnouncementBanner'
import { getLocale } from '@/lib/getLocale'
import { getSiteSettings } from '@/lib/queries/settings'
import { getNavigationItems } from '@/lib/queries/navigation'
import { getPublishedServices } from '@/lib/queries/services'
import { getSocialLinks } from '@/lib/queries/socialLinks'
import { buildOrganizationJsonLd, jsonLdScript } from '@/lib/jsonLd'

// Type roles from DESIGN.md: wide atelier capitals for display, a neutral
// sans with full French diacritics for text.
const unbounded = Unbounded({ subsets: ['latin'], variable: '--font-unbounded', display: 'swap' })
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap' })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const title = settings.defaultSeoTitleFr || 'Mygale Art & Services'
  const description = settings.defaultSeoDescriptionFr || ''
  const ogImage = settings.defaultOgImage?.url || '/LOGO MYGALE 2.png'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [ogImage],
      url: 'https://www.mygaleartetservices.org',
      siteName: settings.companyNameFr,
    },
    icons: {
      icon: settings.favicon?.url || '/LOGO MYGALE 2.png',
    },
    metadataBase: new URL('https://www.mygaleartetservices.org'),
    verification: settings.googleSiteVerification
      ? { google: settings.googleSiteVerification }
      : undefined,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, navItems, services, settings, socialLinks] = await Promise.all([
    getLocale(),
    getNavigationItems(),
    getPublishedServices(),
    getSiteSettings(),
    getSocialLinks(),
  ])

  const organizationJsonLd = buildOrganizationJsonLd({
    companyName: settings.companyNameFr,
    logoUrl: settings.logo?.url,
    streetAddress: settings.addressFr,
    addressLocality: settings.city,
    addressCountry: settings.country,
    phone: settings.phonePrimary || settings.whatsapp,
    email: settings.emailPrimary,
    socialUrls: socialLinks.map((s) => s.url),
  })

  return (
    <html lang={locale} className={`${unbounded.variable} ${instrument.variable}`}>
      <body className="bg-canvas text-ink antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(organizationJsonLd) }}
        />
        <LocaleProvider initialLang={locale}>
          <MotionProvider>
          <RouteProgress />
          <SmoothScroll />
          <div className="min-h-screen flex flex-col">
            <Suspense fallback={<div className="min-h-12" aria-hidden />}>
              <AnnouncementBanner />
            </Suspense>
            <Navbar
              navItems={navItems}
              services={services.map((s) => ({ slug: s.slug, titleFr: s.titleFr, titleEn: s.titleEn }))}
              whatsapp={settings.whatsapp}
            />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          </MotionProvider>
        </LocaleProvider>

        <Analytics />
      </body>
    </html>
  )
}
