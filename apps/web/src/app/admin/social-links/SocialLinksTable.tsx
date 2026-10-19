'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SortableList from '@/components/admin/SortableList'
import { SortableRow, DragHandle } from '@/components/admin/SortableRow'
import { bulkReorderSocialLinks, deleteSocialLink } from './actions'
import { useAdminT } from '@/lib/locale'

type LinkRow = { id: string; platform: string; label: string | null; url: string; visible: boolean }

export default function SocialLinksTable({ links: initial }: { links: LinkRow[] }) {
  const [links, setLinks] = useState(initial)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const adminT = useAdminT()
  const t = adminT.socialLinks
  const common = adminT.common

  // See ServicesTable for why this sync is required after same-route redirects.
  useEffect(() => {
    setLinks(initial)
  }, [initial])

  function handleReorder(orderedIds: string[]) {
    const reordered = orderedIds
      .map((id) => links.find((l) => l.id === id))
      .filter((l): l is LinkRow => Boolean(l))
    setLinks(reordered)
    startTransition(async () => {
      await bulkReorderSocialLinks(orderedIds)
      router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800">
      <SortableList id="social-links-table" items={links} onReorder={handleReorder}>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3 w-10"></th>
              <th className="px-4 py-3">{t.tablePlatform}</th>
              <th className="px-4 py-3">{t.tableUrl}</th>
              <th className="px-4 py-3">{t.tableVisible}</th>
              <th className="px-4 py-3">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {links.map((link) => (
              <SortableRow key={link.id} id={link.id} className="bg-neutral-950">
                {({ dragHandleProps }) => (
                  <>
                    <td className="px-4 py-3">
                      <DragHandle dragHandleProps={dragHandleProps} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{link.platform}</div>
                      {link.label ? (
                        <div className="text-xs text-neutral-400">{link.label}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 truncate max-w-xs">{link.url}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          link.visible
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-neutral-700/40 text-neutral-300'
                        }`}
                      >
                        {link.visible ? common.visible : common.hidden}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/social-links/${link.id}/edit`}
                          className="rounded border border-neutral-700 px-3 py-1 text-xs"
                        >
                          {t.edit}
                        </Link>

                        <form action={deleteSocialLink}>
                          <input type="hidden" name="id" value={link.id} />
                          <button
                            type="submit"
                            className="rounded border border-red-500/60 px-3 py-1 text-xs text-red-200"
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
      {links.length === 0 ? (
        <div className="px-4 py-6 text-sm text-neutral-400">{t.noLinks}</div>
      ) : null}
    </div>
  )
}
