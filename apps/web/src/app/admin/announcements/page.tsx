import Link from 'next/link'
import prisma from '@/lib/prisma'
import { deleteAnnouncement, toggleAnnouncementActive } from './actions'
import { getAdminT, getLocale } from '@/lib/getLocale'
import type { Lang } from '@/lib/locale'

function formatDate(value: Date | null, lang: Lang) {
  if (!value) return '--'
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

export default async function AdminAnnouncementsPage() {
  const lang = await getLocale()
  const [announcements, adminT] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: [{ createdAt: 'desc' }],
    }),
    getAdminT(),
  ])
  const t = adminT.announcements
  const common = adminT.common

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-neutral-400">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/announcements/new"
          className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold"
        >
          {t.newAnnouncement}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.tableTitle}</th>
              <th className="px-4 py-3">{t.tableType}</th>
              <th className="px-4 py-3">{t.tableActive}</th>
              <th className="px-4 py-3">{t.tableSchedule}</th>
              <th className="px-4 py-3 whitespace-nowrap">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {announcements.map((announcement) => (
              <tr key={announcement.id} className="bg-neutral-950">
                <td className="px-4 py-3 max-w-xs">
                  <div className="font-semibold">{announcement.title}</div>
                  <div className="text-xs text-neutral-400 line-clamp-2">
                    {announcement.message}
                  </div>
                </td>
                <td className="px-4 py-3 uppercase text-xs text-neutral-300 whitespace-nowrap">
                  {announcement.type}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      announcement.active
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-neutral-700/40 text-neutral-300'
                    }`}
                  >
                    {announcement.active ? common.active : common.inactive}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300 whitespace-nowrap">
                  <div className="text-xs">{t.startLabel}: {formatDate(announcement.startsAt, lang)}</div>
                  <div className="text-xs">{t.endLabel}: {formatDate(announcement.endsAt, lang)}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/announcements/${announcement.id}/edit`}
                      className="rounded border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-800"
                    >
                      {t.edit}
                    </Link>

                    <form action={toggleAnnouncementActive} className="inline">
                      <input type="hidden" name="id" value={announcement.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={(!announcement.active).toString()}
                      />
                      <button
                        type="submit"
                        className="rounded border border-neutral-700 px-2 py-1 text-xs hover:bg-neutral-800"
                      >
                        {announcement.active ? t.off : t.on}
                      </button>
                    </form>

                    <form action={deleteAnnouncement} className="inline">
                      <input type="hidden" name="id" value={announcement.id} />
                      <button
                        type="submit"
                        className="rounded border border-red-500/60 px-2 py-1 text-xs text-red-200 hover:bg-red-500/10"
                      >
                        {t.delete}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {announcements.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-400">{t.noAnnouncements}</div>
        ) : null}
      </div>
    </div>
  )
}
