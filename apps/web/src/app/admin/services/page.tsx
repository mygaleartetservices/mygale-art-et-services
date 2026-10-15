import Link from 'next/link'
import prisma from '@/lib/prisma'
import { restoreService } from './actions'
import { getAdminT } from '@/lib/getLocale'
import ServicesTable from './ServicesTable'

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const showTrash = tab === 'trash'

  const [services, adminT] = await Promise.all([
    prisma.service.findMany({
      where: showTrash ? { deletedAt: { not: null } } : { deletedAt: null },
      orderBy: showTrash ? { updatedAt: 'desc' } : { order: 'asc' },
    }),
    getAdminT(),
  ])
  const t = adminT.services

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-neutral-400">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/services/new"
          className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold"
        >
          {t.newService}
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/admin/services"
          className={`rounded px-3 py-1 ${!showTrash ? 'bg-neutral-800' : 'border border-neutral-800'}`}
        >
          {t.tabActive}
        </Link>
        <Link
          href="/admin/services?tab=trash"
          className={`rounded px-3 py-1 ${showTrash ? 'bg-neutral-800' : 'border border-neutral-800'}`}
        >
          {t.tabTrash}
        </Link>
      </div>

      {!showTrash ? (
        <ServicesTable services={services} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-900 text-neutral-300">
              <tr>
                <th className="px-4 py-3">{t.tableTitle}</th>
                <th className="px-4 py-3">{t.tableSlug}</th>
                <th className="px-4 py-3">{t.tableActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {services.map((service) => (
                <tr key={service.id} className="bg-neutral-950">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{service.titleFr}</div>
                    <div className="text-xs text-neutral-400">{service.titleEn}</div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">{service.slug}</td>
                  <td className="px-4 py-3">
                    <form action={restoreService}>
                      <input type="hidden" name="id" value={service.id} />
                      <button
                        type="submit"
                        className="rounded border border-neutral-700 px-3 py-1 text-xs"
                      >
                        {t.restore}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {services.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-400">{t.trashEmpty}</div>
          ) : null}
        </div>
      )}
    </div>
  )
}
