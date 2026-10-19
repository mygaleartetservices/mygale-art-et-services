import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import {
  ADMIN_PAGES,
  NAV_TRANSLATION_KEY,
  hasPageAccess,
} from '@/lib/adminPages'
import { getUnreadContactCount } from '@/lib/queries/contactSubmissions'
import { getAdminT, getLocale } from '@/lib/getLocale'
import AdminIcon from '@/components/admin/AdminIcon'

/*
 * Admin home. It used to be a wall of one identical card per section, which
 * repeated the sidebar and said nothing about the site. It now answers "what
 * needs me today": the numbers that matter, the newest unanswered messages,
 * one-tap actions for the common jobs, then a compact index of every section
 * this account can open.
 */
export default async function AdminHomePage() {
  const user = await getCurrentUser()
  const t = await getAdminT()
  const locale = await getLocale()
  const can = (key: string) => (user ? hasPageAccess(user, key) : false)

  const [unread, published, drafts, posts, latest] = await Promise.all([
    can('contact-submissions') ? getUnreadContactCount() : Promise.resolve(null),
    can('services')
      ? prisma.service.count({ where: { published: true, deletedAt: null } })
      : Promise.resolve(null),
    can('services')
      ? prisma.service.count({ where: { published: false, deletedAt: null } })
      : Promise.resolve(null),
    can('blog') ? prisma.blogPost.count({ where: { published: true } }) : Promise.resolve(null),
    can('contact-submissions')
      ? prisma.contactSubmission.findMany({
          where: { status: 'new' },
          orderBy: { createdAt: 'desc' },
          take: 4,
          select: { id: true, name: true, message: true, createdAt: true },
        })
      : Promise.resolve([]),
  ])

  const stats = [
    { key: 'unread', label: t.overview.statUnread, value: unread, href: '/admin/contact-submissions', highlight: (unread ?? 0) > 0 },
    { key: 'published', label: t.overview.statPublished, value: published, href: '/admin/services' },
    { key: 'drafts', label: t.overview.statDrafts, value: drafts, href: '/admin/services' },
    { key: 'posts', label: t.overview.statPosts, value: posts, href: '/admin/blog' },
  ].filter((stat) => stat.value !== null)

  const actions = [
    can('services') && { href: '/admin/services/new', icon: 'plus', label: t.overview.actionNewService },
    can('blog') && { href: '/admin/blog/new', icon: 'blog', label: t.overview.actionNewPost },
    can('media') && { href: '/admin/media', icon: 'upload', label: t.overview.actionUpload },
    can('attendance') && { href: '/admin/attendance/qr', icon: 'qr', label: t.overview.actionAttendanceQr },
  ].filter(Boolean) as { href: string; icon: string; label: string }[]

  const sections = ADMIN_PAGES.filter((page) => can(page.key))
  const firstName = user?.name.trim().split(/\s+/)[0] ?? ''
  const dateFormat = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-neutral-400">{t.overview.title}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {t.overview.greeting.replace('{name}', firstName)}
        </h1>
      </header>

      {stats.length > 0 ? (
        <section aria-label={t.overview.title} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.key}
              href={stat.href}
              className={`rounded-xl border p-4 transition-colors hover:border-neutral-700 sm:p-5 ${
                stat.highlight ? 'border-[#1f44c9]/60 bg-[#1f44c9]/15' : 'border-neutral-800 bg-neutral-900'
              }`}
            >
              <div className="text-xs text-neutral-400 sm:text-sm">{stat.label}</div>
              <div className="mt-2 font-[family-name:var(--font-unbounded)] text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                {stat.value}
              </div>
            </Link>
          ))}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {can('contact-submissions') ? (
          <section className="rounded-xl border border-neutral-800 bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
              <h2 className="text-base font-semibold">{t.overview.needsAttention}</h2>
              <Link
                href="/admin/contact-submissions"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--admin-accent)] hover:underline"
              >
                {t.overview.openInbox}
                <AdminIcon name="arrow" size={14} />
              </Link>
            </div>
            {latest.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400">{t.overview.inboxEmpty}</p>
            ) : (
              <ul className="divide-y divide-neutral-800">
                {latest.map((message) => (
                  <li key={message.id}>
                    <Link
                      href={`/admin/contact-submissions/${message.id}`}
                      className="flex gap-3 px-5 py-4 transition-colors hover:bg-neutral-800/50"
                    >
                      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--admin-accent)]" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-sm font-semibold text-neutral-100">{message.name}</span>
                          <span className="shrink-0 text-xs text-neutral-500">
                            {dateFormat.format(message.createdAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-sm text-neutral-400">{message.message}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-base font-semibold">{t.overview.quickActions}</h2>
          <div className="grid gap-2">
            <Link
              href="/admin/my-attendance"
              className="flex min-h-12 items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-sm font-medium transition-colors hover:border-neutral-700 hover:bg-neutral-800/60"
            >
              <AdminIcon name="my-attendance" className="text-[var(--admin-accent)]" />
              {t.nav.myAttendance}
            </Link>
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900 px-4 text-sm font-medium transition-colors hover:border-neutral-700 hover:bg-neutral-800/60"
              >
                <AdminIcon name={action.icon} className="text-[var(--admin-accent)]" />
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {sections.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-semibold">{t.overview.allSections}</h2>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {sections.map((page) => (
              <li key={page.key}>
                <Link
                  href={page.href}
                  className="flex h-full gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4 transition-colors hover:border-neutral-700 hover:bg-neutral-800/60"
                >
                  <AdminIcon name={page.key} className="mt-0.5 shrink-0 text-neutral-400" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-neutral-100">
                      {(t.nav[NAV_TRANSLATION_KEY[page.key] as keyof typeof t.nav] as string | undefined) ?? page.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-neutral-400">
                      {t.overview.cardDescriptions[page.key as keyof typeof t.overview.cardDescriptions]}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
