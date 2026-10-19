/* apps/web/src/components/AdminSidebar.tsx */
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { signOut } from '@/app/auth/actions'
import type { Role } from '@prisma/client'
import {
  ADMIN_PAGES,
  MY_ATTENDANCE_SECTION_KEY,
  NAV_TRANSLATION_KEY,
  OVERVIEW_SECTION_KEY,
  hasPageAccess,
} from '@/lib/adminPages'
import { useAdminT, useLocale } from '@/lib/locale'
import ContactUnreadBadge from '@/components/ContactUnreadBadge'
import AdminIcon from '@/components/admin/AdminIcon'

type SidebarUser = {
  name: string
  role: Role | null
  pagesRestricted: boolean
  allowedPages: string[]
}

type NavLink = { key: string; href: string; label: string }

/** Sidebar sections, in order. Keys not listed here fall into "Site settings". */
const GROUPS: { id: 'groupWork' | 'groupContent' | 'groupSite' | 'groupTeam' | 'groupSystem'; keys: string[] }[] = [
  { id: 'groupWork', keys: [OVERVIEW_SECTION_KEY, 'contact-submissions', MY_ATTENDANCE_SECTION_KEY] },
  {
    id: 'groupContent',
    keys: ['services', 'homepage', 'about', 'media', 'blog', 'blog-categories', 'announcements'],
  },
  { id: 'groupSite', keys: ['navigation', 'social-links', 'redirects', 'settings'] },
  { id: 'groupTeam', keys: ['users', 'departments', 'attendance'] },
  { id: 'groupSystem', keys: ['audit-log'] },
]

/** The overview only matches exactly; every other section owns its sub-pages. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminSidebar({
  user,
  unreadContactCount,
}: {
  user: SidebarUser
  unreadContactCount: number
}) {
  const t = useAdminT()
  const { lang, setLang } = useLocale()
  const pathname = usePathname() ?? '/admin'
  const [open, setOpen] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const label = (key: string, fallback: string) =>
    (t.nav[NAV_TRANSLATION_KEY[key] as keyof typeof t.nav] as string | undefined) ?? fallback

  const links: Record<string, NavLink> = {
    [OVERVIEW_SECTION_KEY]: { key: OVERVIEW_SECTION_KEY, href: '/admin', label: t.nav.overview },
    [MY_ATTENDANCE_SECTION_KEY]: {
      key: MY_ATTENDANCE_SECTION_KEY,
      href: '/admin/my-attendance',
      label: t.nav.myAttendance,
    },
  }
  for (const page of ADMIN_PAGES) {
    if (hasPageAccess(user, page.key)) {
      links[page.key] = { key: page.key, href: page.href, label: label(page.key, page.label) }
    }
  }
  const grouped = GROUPS.map((group) => ({
    ...group,
    items: group.keys.map((key) => links[key]).filter(Boolean),
  })).filter((group) => group.items.length > 0)

  // Close the drawer when the route changes (state adjusted during render,
  // not in an effect), and on Escape below.
  const [drawerPath, setDrawerPath] = useState(pathname)
  if (drawerPath !== pathname) {
    setDrawerPath(pathname)
    setOpen(false)
  }

  // Long link lists scroll inside the sidebar: bring the current page's link
  // into view so sections near the bottom (Team, System) still show where
  // you are.
  useEffect(() => {
    document
      .querySelectorAll<HTMLElement>('aside nav [aria-current="page"]')
      .forEach((link) => link.scrollIntoView({ block: 'nearest' }))
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const menuButton = menuButtonRef.current
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      menuButton?.focus()
    }
  }, [open])

  const roleLabel = user.role ? t.layout.roles[user.role] : t.layout.roles.USER

  const navList = (
    <nav aria-label={t.nav.adminLabel} className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
      {grouped.map((group) => (
        <div key={group.id} className="mb-5 last:mb-0">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
            {t.nav[group.id]}
          </div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href)
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-[#1f44c9]/25 font-semibold text-white'
                        : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
                    }`}
                  >
                    {active ? (
                      <span
                        aria-hidden
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--admin-accent)]"
                      />
                    ) : null}
                    <AdminIcon
                      name={item.key}
                      className={active ? 'text-[var(--admin-accent)]' : 'text-neutral-500 group-hover:text-neutral-300'}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.key === 'contact-submissions' ? (
                      <ContactUnreadBadge initialCount={unreadContactCount} />
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 rounded-lg">
      <Image src="/LOGO MYGALE 2.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md bg-white/95 object-contain p-0.5" />
      <span className="leading-tight">
        <span className="block font-[family-name:var(--font-unbounded)] text-sm font-semibold tracking-wide text-white">
          MYGALE
        </span>
        <span className="block text-xs text-neutral-500">{t.nav.adminLabel}</span>
      </span>
    </Link>
  )

  const footer = (
    <div className="border-t border-neutral-800 px-3 py-3">
      <div className="flex items-center gap-3 px-3 py-2">
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-sm font-semibold text-neutral-200"
        >
          {user.name.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-medium text-neutral-100">{user.name}</span>
          <span className="block truncate text-xs text-neutral-500">{roleLabel}</span>
        </span>
        <button
          type="button"
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          aria-label={t.nav.switchLanguage}
          title={t.nav.switchLanguage}
          className="flex h-9 min-w-9 items-center justify-center rounded-md border border-neutral-700 px-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white"
        >
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </div>
      <div className="mt-1 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-neutral-400 hover:bg-neutral-900 hover:text-white"
        >
          <AdminIcon name="external" size={16} />
          {t.nav.viewSite}
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            <AdminIcon name="logout" size={16} />
            {t.nav.signOut}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: fixed to the viewport, its own scroll for the link list. */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950 md:flex">
        <div className="px-6 pb-2 pt-5">{brand}</div>
        {navList}
        {footer}
      </aside>

      {/* Phone and small tablet: a top bar and a slide-in drawer. */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-neutral-800 bg-neutral-950/95 px-4 backdrop-blur md:hidden">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t.nav.openMenu}
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-neutral-200 hover:bg-neutral-900"
        >
          <AdminIcon name="menu" size={22} />
        </button>
        {brand}
      </div>

      <div
        className={`fixed inset-0 z-40 md:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 motion-reduce:transition-none ${open ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          id="admin-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={t.nav.adminLabel}
          className={`absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-neutral-800 bg-neutral-950 shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? 'translate-x-0' : '-translate-x-full'}`}
          {...(!open ? { inert: true } : {})}
        >
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            {brand}
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t.nav.closeMenu}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-300 hover:bg-neutral-900"
            >
              <AdminIcon name="close" size={20} />
            </button>
          </div>
          {navList}
          {footer}
        </aside>
      </div>
    </>
  )
}
