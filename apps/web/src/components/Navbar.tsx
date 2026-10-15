'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocale, type Lang } from '@/lib/locale'
import { whatsappLink } from '@/lib/whatsapp'
import { drawerFromRight, popover, staggerContainer, staggerItem } from '@/lib/animations'

type NavItem = {
  id: string
  key: string | null
  labelFr: string
  labelEn: string
  href: string | null
  linkType: 'INTERNAL' | 'EXTERNAL' | 'SERVICES_DROPDOWN'
  openInNewTab: boolean
}

type ServiceLink = { slug: string; titleFr: string; titleEn: string }

const COPY: Record<Lang, { whatsapp: string; menu: string; close: string; allServices: string; language: string }> = {
  fr: {
    whatsapp: 'Écrire sur WhatsApp',
    menu: 'Ouvrir le menu',
    close: 'Fermer le menu',
    allServices: 'Tous les services',
    language: 'Langue',
  },
  en: {
    whatsapp: 'Message us on WhatsApp',
    menu: 'Open menu',
    close: 'Close menu',
    allServices: 'All services',
    language: 'Language',
  },
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.6-1.3a.5.5 0 0 0 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.2c-.1-.2-.3-.2-.6-.3Z" />
    </svg>
  )
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  // A visible "FR | EN" text switch: languages, not flags (UX-10).
  return (
    <div className="flex items-center rounded-button border border-line p-0.5 text-xs font-semibold" role="group" aria-label="Langue / Language">
      {(['fr', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-[0.4rem] px-2.5 py-1.5 uppercase transition-colors ${lang === code ? 'bg-ink text-surface' : 'text-ink-muted hover:text-ink'}`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}

export default function Navbar({
  navItems,
  services,
  whatsapp,
}: {
  navItems: NavItem[]
  services: ServiceLink[]
  whatsapp?: string | null
}) {
  const { lang, setLang } = useLocale()
  const copy = COPY[lang]
  const pathname = usePathname() ?? '/'
  const [lastPathname, setLastPathname] = useState(pathname)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const drawerRef = useRef<HTMLDivElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)

  // Close menus on navigation (adjusting state during render, not in an effect).
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpen(false)
    setServicesOpen(false)
  }

  const wa = whatsappLink(whatsapp, lang)
  const servicesList = services.map((s) => ({ slug: s.slug, label: lang === 'en' ? s.titleEn : s.titleFr }))
  const label = (item: NavItem) => (lang === 'en' ? item.labelEn : item.labelFr)
  const isActive = (href: string | null) =>
    !!href && (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Services dropdown: click or keyboard to open, outside click or ESC to close.
  useEffect(() => {
    if (!servicesOpen) return
    const onPointer = (e: PointerEvent) => {
      if (!servicesRef.current?.contains(e.target as Node)) setServicesOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setServicesOpen(false)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [servicesOpen])

  // Mobile drawer: ESC closes, focus stays inside, page does not scroll behind.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus())
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header
      className={`sticky top-0 z-50 h-(--header-h) border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        scrolled ? 'border-line bg-canvas/90 shadow-soft backdrop-blur-md' : 'border-transparent bg-canvas'
      }`}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <span className="relative h-10 w-10">
            <Image src="/LOGO MYGALE 2.png" alt="" fill sizes="40px" style={{ objectFit: 'contain' }} priority />
          </span>
          <span className="leading-none">
            <span className="block font-display text-base font-bold tracking-wide text-ink">MYGALE</span>
            <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
              {lang === 'en' ? 'Art & Services' : 'Art et Services'}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm md:flex" aria-label="Navigation">
          {navItems.map((item) => {
            if (item.linkType === 'SERVICES_DROPDOWN') {
              const active = pathname.startsWith('/services')
              return (
                <div ref={servicesRef} className="relative" key={item.id}>
                  <button
                    type="button"
                    onClick={() => setServicesOpen((o) => !o)}
                    aria-expanded={servicesOpen}
                    aria-haspopup="true"
                    className={`inline-flex items-center gap-1 rounded-button px-3 py-2 font-medium transition-colors ${active ? 'text-primary' : 'text-ink hover:bg-ink/5'}`}
                  >
                    {label(item)}
                    <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} aria-hidden="true">
                      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        variants={popover}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{ transformOrigin: 'top left' }}
                        className="absolute left-0 top-full mt-2 w-64 rounded-card border border-line bg-surface p-1.5 shadow-lifted"
                      >
                        {servicesList.map((s) => (
                          <Link
                            key={s.slug}
                            href={`/services/${s.slug}`}
                            aria-current={pathname === `/services/${s.slug}` ? 'page' : undefined}
                            className={`block rounded-[0.5rem] px-3 py-2.5 transition-colors hover:bg-ink/5 ${pathname === `/services/${s.slug}` ? 'font-semibold text-primary' : 'text-ink'}`}
                          >
                            {s.label}
                          </Link>
                        ))}
                        <Link href={item.href || '/services'} className="mt-1 block border-t border-line px-3 pb-1.5 pt-2.5 text-ink-muted hover:text-ink">
                          {copy.allServices}
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            }
            const active = isActive(item.href)
            return (
              <Link
                key={item.id}
                href={item.href || '#'}
                target={item.openInNewTab ? '_blank' : undefined}
                rel={item.openInNewTab ? 'noreferrer' : undefined}
                aria-current={active ? 'page' : undefined}
                className={`relative rounded-button px-3 py-2 font-medium transition-colors ${active ? 'text-primary' : 'text-ink hover:bg-ink/5'}`}
              >
                {label(item)}
                {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" aria-hidden="true" />}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LangSwitch lang={lang} setLang={setLang} />
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary hidden !px-4 !py-2.5 text-sm lg:inline-flex">
              <WhatsAppGlyph className="h-4 w-4" />
              {copy.whatsapp}
            </a>
          )}
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={copy.menu}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-button text-ink hover:bg-ink/5 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              <path d="M4 7h16M4 12h11M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 md:hidden" key="drawer">
            <motion.div
              className="absolute inset-0 bg-ink/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mobile-menu"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              variants={drawerFromRight}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-y-0 right-0 flex w-full max-w-xs flex-col gap-6 overflow-y-auto bg-surface p-6 shadow-lifted"
            >
              <div className="flex items-center justify-between">
                <LangSwitch lang={lang} setLang={setLang} />
                <button
                  type="button"
                  aria-label={copy.close}
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-button text-ink hover:bg-ink/5"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <motion.nav variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col" aria-label="Navigation">
                {navItems.map((item) =>
                  item.linkType === 'SERVICES_DROPDOWN' ? (
                    <motion.div key={item.id} variants={staggerItem} className="border-b border-line py-3">
                      <Link href={item.href || '/services'} className="font-display text-lg font-semibold text-ink">
                        {label(item)}
                      </Link>
                      <div className="mt-2 flex flex-col">
                        {servicesList.map((s) => (
                          <Link key={s.slug} href={`/services/${s.slug}`} className="py-1.5 text-sm text-ink-muted hover:text-ink">
                            {s.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key={item.id} variants={staggerItem}>
                      <Link
                        href={item.href || '#'}
                        className={`block border-b border-line py-3.5 font-display text-lg font-semibold ${isActive(item.href) ? 'text-primary' : 'text-ink'}`}
                      >
                        {label(item)}
                      </Link>
                    </motion.div>
                  ),
                )}
              </motion.nav>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary mt-auto w-full">
                  <WhatsAppGlyph className="h-5 w-5" />
                  {copy.whatsapp}
                </a>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  )
}
