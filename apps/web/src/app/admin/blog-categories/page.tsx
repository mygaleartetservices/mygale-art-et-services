import prisma from '@/lib/prisma'
import { createBlogCategory, deleteBlogCategory } from './actions'
import { getAdminT } from '@/lib/getLocale'

export default async function AdminBlogCategoriesPage() {
  const [categories, adminT] = await Promise.all([
    prisma.blogCategory.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { posts: true } } },
    }),
    getAdminT(),
  ])
  const t = adminT.blogCategories

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <p className="text-sm text-neutral-400">{t.subtitle}</p>
      </div>

      <form
        action={createBlogCategory}
        className="grid gap-3 rounded-xl border border-neutral-800 p-4 md:grid-cols-3"
      >
        <input
          name="nameFr"
          placeholder={t.nameFrPlaceholder}
          required
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
        />
        <input
          name="nameEn"
          placeholder={t.nameEnPlaceholder}
          required
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold">
          {t.addCategory}
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.tableName}</th>
              <th className="px-4 py-3">{t.tableSlug}</th>
              <th className="px-4 py-3">{t.tablePosts}</th>
              <th className="px-4 py-3">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {categories.map((c) => (
              <tr key={c.id} className="bg-neutral-950">
                <td className="px-4 py-3">
                  <div className="font-semibold">{c.nameFr}</div>
                  <div className="text-xs text-neutral-400">{c.nameEn}</div>
                </td>
                <td className="px-4 py-3 text-neutral-300">{c.slug}</td>
                <td className="px-4 py-3 text-neutral-300">{c._count.posts}</td>
                <td className="px-4 py-3">
                  <form action={deleteBlogCategory}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="rounded border border-red-500/60 px-3 py-1 text-xs text-red-200"
                    >
                      {t.delete}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {categories.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-400">{t.noCategories}</div>
        ) : null}
      </div>
    </div>
  )
}
