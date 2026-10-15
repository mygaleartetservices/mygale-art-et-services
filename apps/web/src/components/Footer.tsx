// apps/web/src/components/Footer.tsx
import React from 'react'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/queries/settings'
import { getSocialLinks } from '@/lib/queries/socialLinks'
import { getNavigationItems } from '@/lib/queries/navigation'
import { getLocale } from '@/lib/getLocale'
import { PLATFORM_LABEL } from '@/lib/socialPlatforms'
import SocialIcon from './SocialIcon'

export default async function Footer() {
  const [settings, socialLinks, navItems, locale] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getNavigationItems(),
    getLocale(),
  ])

  const isEn = locale === 'en'
  const companyName = isEn ? settings.companyNameEn : settings.companyNameFr
  const description = isEn ? settings.taglineEn : settings.taglineFr
  const address = (isEn ? settings.addressEn : settings.addressFr) || settings.city
  const phones = [settings.phonePrimary, settings.phoneSecondary].filter(Boolean) as string[]
  const emails = [settings.emailPrimary, settings.emailContact].filter(
    (v, i, arr) => Boolean(v) && arr.indexOf(v) === i,
  ) as string[]

  const t = {
    navigation: isEn ? 'Navigation' : 'Navigation',
    contact: 'Contact',
    followUs: isEn ? 'Follow us' : 'Suivez-nous',
    allRightsReserved: isEn ? 'All rights reserved.' : 'Tous droits réservés.',
  }

  return (
    <footer className="bg-ink py-14 text-surface/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 text-sm sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <div className="font-display text-lg font-bold text-surface">{companyName}</div>
          {description ? <p className="mt-3 max-w-sm text-surface/70">{description}</p> : null}
        </div>

        {navItems.length > 0 ? (
          <div>
            <div className="font-semibold text-surface">{t.navigation}</div>
            <ul className="mt-2 space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link
                    className="transition-colors hover:text-surface"
                    href={item.href || (item.linkType === 'SERVICES_DROPDOWN' ? '/services' : '#')}
                  >
                    {isEn ? item.labelEn : item.labelFr}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <div className="font-semibold text-surface">{t.contact}</div>
          <div className="mt-2 space-y-1">
            {address ? <div>{address}</div> : null}
            {phones.map((phone) => (
              <div key={phone}>
                <a className="transition-colors hover:text-surface" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                  {phone}
                </a>
              </div>
            ))}
            {emails.map((email) => (
              <div key={email}>
                <a className="transition-colors hover:text-surface" href={`mailto:${email}`}>
                  {email}
                </a>
              </div>
            ))}
          </div>
        </div>

        {socialLinks.length > 0 ? (
          <div>
            <div className="font-semibold text-surface">{t.followUs}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label || PLATFORM_LABEL[link.platform] || link.platform}
                  title={link.label || PLATFORM_LABEL[link.platform] || link.platform}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-surface/20 text-surface transition-colors hover:border-surface hover:bg-surface hover:text-ink"
                >
                  <SocialIcon platform={link.platform} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-surface/15 px-4 pt-6 text-xs text-surface/60 sm:px-6">
        © {new Date().getFullYear()} {companyName}. {t.allRightsReserved}
      </div>
    </footer>
  )
}
