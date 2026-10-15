'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SortableList from '@/components/admin/SortableList'
import { SortableRow, DragHandle } from '@/components/admin/SortableRow'
import { bulkReorderServices, softDeleteService, toggleServicePublish } from './actions'
import { useAdminT } from '@/lib/locale'

type ServiceRow = {
  id: string
  titleFr: string
  titleEn: string
  slug: string
  featured: boolean
  published: boolean
}

export default function ServicesTable({ services: initial }: { services: ServiceRow[] }) {
  const [services, setServices] = useState(initial)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const adminT = useAdminT()
  const t = adminT.services
  const common = adminT.common

  // Server actions redirect back to this same route after mutating (publish
  // toggle, soft-delete, etc.); Next.js refreshes the RSC payload but this
  // component's own useState never re-derives from a changed prop on its
  // own, so without this the table can keep showing pre-mutation data.
  useEffect(() => {
    setServices(initial)
  }, [initial])

  function handleReorder(orderedIds: string[]) {
    const reordered = orderedIds
      .map((id) => services.find((s) => s.id === id))
      .filter((s): s is ServiceRow => Boolean(s))
    setServices(reordered)
    startTransition(async () => {
      await bulkReorderServices(orderedIds)
      router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800">
      <SortableList id="services-table" items={services} onReorder={handleReorder}>
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">{t.tableTitle}</th>
              <th className="px-4 py-3">{t.tableSlug}</th>
              <th className="px-4 py-3">{t.tableFeatured}</th>
              <th className="px-4 py-3">{t.tableStatus}</th>
              <th className="px-4 py-3">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {services.map((service) => (
              <SortableRow key={service.id} id={service.id} className="bg-neutral-950">
                {({ dragHandleProps }) => (
                  <>
                    <td className="px-4 py-3">
                      <DragHandle dragHandleProps={dragHandleProps} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/services/${service.id}/edit`}
                        className="font-semibold text-neutral-100 hover:text-white hover:underline"
                      >
                        {service.titleFr}
                      </Link>
                      <div className="text-xs text-neutral-400">{service.titleEn}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-400">{service.slug}</td>
                    <td className="px-4 py-3 text-neutral-300">{service.featured ? t.yes : t.no}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          service.published
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}
                      >
                        {service.published ? common.published : common.draft}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* One clear primary, quiet secondary actions, the
                          destructive one set apart. It used to be five
                          identical outlined buttons per row. */}
                      <div className="flex flex-wrap items-center gap-1">
                        <Link
                          href={`/admin/services/${service.id}/edit`}
                          className="inline-flex min-h-9 items-center rounded-lg bg-[#1f44c9] px-3 text-xs font-semibold text-white hover:bg-[#1937a6]"
                        >
                          {t.edit}
                        </Link>
                        <Link
                          href={`/services/${service.slug}?preview=1`}
                          target="_blank"
                          className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white"
                        >
                          {t.preview}
                        </Link>
                        <Link
                          href={`/admin/services/${service.id}/revisions`}
                          className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white"
                        >
                          {t.history}
                        </Link>

                        <form action={toggleServicePublish}>
                          <input type="hidden" name="id" value={service.id} />
                          <input
                            type="hidden"
                            name="published"
                            value={(!service.published).toString()}
                          />
                          <button
                            type="submit"
                            className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white"
                          >
                            {service.published ? t.unpublish : t.publish}
                          </button>
                        </form>

                        <form action={softDeleteService} className="ml-1 border-l border-neutral-800 pl-1">
                          <input type="hidden" name="id" value={service.id} />
                          <button
                            type="submit"
                            className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
                          >
                            {t.delete}
                          </button>
                        </form>
                      </div>
                    </td>
                  </>
                )}
              </SortableRow>
            ))}
          </tbody>
        </table>
      </SortableList>
      {services.length === 0 ? (
        <div className="px-4 py-6 text-sm text-neutral-400">{t.noServices}</div>
      ) : null}
    </div>
  )
}
