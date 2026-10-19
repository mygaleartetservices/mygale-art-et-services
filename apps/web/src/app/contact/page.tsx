import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/queries/settings'
import { getSocialLinks } from '@/lib/queries/socialLinks'
import { getLocale } from '@/lib/getLocale'
import { PLATFORM_LABEL } from '@/lib/socialPlatforms'
import SocialIcon from '@/components/SocialIcon'
import ContactForm from './ContactForm'

export async function generateMetadata(): Promise<Metadata> {
  const [settings, locale] = await Promise.all([getSiteSettings(), getLocale()])
  const title =
    locale === 'en'
      ? `Contact us | ${settings.companyNameEn}`
      : `Contactez-nous | ${settings.companyNameFr}`
  const description =
    (locale === 'en' ? settings.defaultSeoDescriptionEn : settings.defaultSeoDescriptionFr) ||
    undefined
  return { title, description }
}

export default async function ContactPage() {
  const [settings, socialLinks, locale] = await Promise.all([
    getSiteSettings(),
    getSocialLinks(),
    getLocale(),
  ])

  const isEn = locale === 'en'
  const address = (isEn ? settings.addressEn : settings.addressFr) || settings.city
  const hours = isEn ? settings.businessHoursEn : settings.businessHoursFr
  const phones = [settings.phonePrimary, settings.phoneSecondary].filter(Boolean) as string[]
  const emails = [settings.emailPrimary, settings.emailContact].filter(
    (v, i, arr) => Boolean(v) && arr.indexOf(v) === i,
  ) as string[]

  const t = {
    heading: isEn ? 'Contact us' : 'Contactez-nous',
    contactInfo: isEn ? 'Contact Information' : 'Informations de contact',
    address: isEn ? 'Address' : 'Adresse',
    phone: isEn ? 'Phone' : 'Téléphone',
    email: 'Email',
    openingHours: isEn ? 'Opening Hours' : "Horaires d'ouverture",
    followUs: isEn ? 'Follow us' : 'Suivez-nous',
    findUs: isEn ? 'Find us' : 'Nous trouver',
    openInMaps: isEn ? 'Open in Google Maps' : 'Ouvrir dans Google Maps',
  }

  return (
    <div className="bg-surface text-black">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-semibold mb-10">{t.heading}</h1>

        <div className="grid gap-10 md:grid-cols-2">
          {/* LEFT: company contact information, configured by the admin */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-ink">{t.contactInfo}</h2>

            {address ? (
              <div>
                <div className="text-sm font-semibold text-ink-muted">{t.address}</div>
                <div className="text-ink">{address}</div>
              </div>
            ) : null}

            {phones.length > 0 ? (
              <div>
                <div className="text-sm font-semibold text-ink-muted">{t.phone}</div>
                {phones.map((phone) => (
                  <div key={phone}>
                    <a className="text-ink hover:underline" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
                      {phone}
                    </a>
                  </div>
                ))}
              </div>
            ) : null}

            {emails.length > 0 ? (
              <div>
                <div className="text-sm font-semibold text-ink-muted">{t.email}</div>
                {emails.map((email) => (
                  <div key={email}>
                    <a className="text-ink hover:underline" href={`mailto:${email}`}>
                      {email}
                    </a>
                  </div>
                ))}
              </div>
            ) : null}

            {hours ? (
              <div>
                <div className="text-sm font-semibold text-ink-muted">{t.openingHours}</div>
                <div className="text-ink whitespace-pre-line">{hours}</div>
              </div>
            ) : null}

            {socialLinks.length > 0 ? (
              <div>
                <div className="text-sm font-semibold text-ink-muted">{t.followUs}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label || PLATFORM_LABEL[link.platform] || link.platform}
                      title={link.label || PLATFORM_LABEL[link.platform] || link.platform}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F6F8] text-ink shadow-sm transition hover:scale-110 hover:bg-primary hover:text-white"
                    >
                      <SocialIcon platform={link.platform} className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* RIGHT: contact form */}
          <div>
            <ContactForm />
          </div>
        </div>

        {settings.mapEmbedUrl ? (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-6 text-center">{t.findUs}</h2>
            <div className="w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-lg border">
              <iframe
                src={settings.mapEmbedUrl}
                title="Mygale Art et Services location map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            {settings.mapPlaceUrl ? (
              <div className="text-center">
                <a
                  href={settings.mapPlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-block px-6 py-3 rounded-lg bg-primary text-white font-medium shadow hover:scale-105 transition"
                >
                  {t.openInMaps}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
