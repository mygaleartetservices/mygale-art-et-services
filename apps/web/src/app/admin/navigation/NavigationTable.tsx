'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SortableList from '@/components/admin/SortableList'
import { SortableRow, DragHandle } from '@/components/admin/SortableRow'
import { bulkReorderNavigationItems, toggleNavigationItemVisibility } from './actions'
import { useAdminT } from '@/lib/locale'

type NavRow = { id: string; labelFr: string; labelEn: string; href: string | null; visible: boolean }

export default function NavigationTable({ items: initial }: { items: NavRow[] }) {
  const [items, setItems] = useState(initial)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const adminT = useAdminT()
  const t = adminT.navigation
  const common = adminT.common

  // See ServicesTable for why this sync is required after same-route redirects.
  useEffect(() => {
    setItems(initial)
  }, [initial])

  function handleReorder(orderedIds: string[]) {
    const reordered = orderedIds
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is NavRow => Boolean(i))
    setItems(reordered)
    startTransition(async () => {
      await bulkReorderNavigationItems(orderedIds)
      router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800">
      <SortableList id="navigation-table" items={items} onReorder={handleReorder}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">{t.tableLabel}</th>
              <th className="px-4 py-3">{t.tableLink}</th>
              <th className="px-4 py-3">{t.tableVisible}</th>
              <th className="px-4 py-3">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {items.map((item) => (
              <SortableRow key={item.id} id={item.id} className="bg-neutral-950">
                {({ dragHandleProps }) => (
                  <>
                    <td className="px-4 py-3">
                      <DragHandle dragHandleProps={dragHandleProps} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{item.labelFr}</div>
                      <div className="text-xs text-neutral-400">{item.labelEn}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{item.href || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.visible
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-neutral-700/40 text-neutral-300'
                        }`}
                      >
                        {item.visible ? common.visible : common.hidden}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/navigation/${item.id}/edit`}
                          className="rounded border border-neutral-700 px-3 py-1 text-xs"
                        >
                          {t.edit}
                        </Link>

                        <form action={toggleNavigationItemVisibility}>
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="visible" value={(!item.visible).toString()} />
                          <button
                            type="submit"
                            className="rounded border border-neutral-700 px-3 py-1 text-xs"
                          >
                            {item.visible ? t.hide : t.show}
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
    </div>
  )
}
