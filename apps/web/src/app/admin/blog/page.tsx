import Link from 'next/link'
import prisma from '@/lib/prisma'
import { deleteBlogPost, toggleBlogPostPublish } from './actions'
import { getAdminT, getLocale } from '@/lib/getLocale'
import type { Lang } from '@/lib/locale'

function formatDate(value: Date | null, lang: Lang) {
  if (!value) return '--'
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'medium' }).format(value)
}

export default async function AdminBlogPage() {
  const lang = await getLocale()
  const [posts, adminT] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: [{ createdAt: 'desc' }],
    }),
    getAdminT(),
  ])
  const t = adminT.blog
  const common = adminT.common

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-neutral-400">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold"
        >
          {t.newPost}
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-300">
            <tr>
              <th className="px-4 py-3">{t.tableTitle}</th>
              <th className="px-4 py-3">{t.tableLocale}</th>
              <th className="px-4 py-3">{t.tableStatus}</th>
              <th className="px-4 py-3">{t.tablePublished}</th>
              <th className="px-4 py-3">{t.tableActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {posts.map((post) => (
              <tr key={post.id} className="bg-neutral-950">
                <td className="px-4 py-3">
                  <div className="font-semibold">{post.title}</div>
                  <div className="text-xs text-neutral-400">{post.slug}</div>
                </td>
                <td className="px-4 py-3 uppercase text-xs text-neutral-300">{post.locale}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      post.published
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {post.published ? common.published : common.draft}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-300">{formatDate(post.publishedAt, lang)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/blog/${post.id}/edit`}
                      className="rounded border border-neutral-700 px-3 py-1 text-xs"
                    >
                      {t.edit}
                    </Link>

                    <form action={toggleBlogPostPublish}>
                      <input type="hidden" name="id" value={post.id} />
                      <input type="hidden" name="published" value={(!post.published).toString()} />
                      <button
                        type="submit"
                        className="rounded border border-neutral-700 px-3 py-1 text-xs"
                      >
                        {post.published ? t.unpublish : t.publish}
                      </button>
                    </form>

                    <form action={deleteBlogPost}>
                      <input type="hidden" name="id" value={post.id} />
                      <button
                        type="submit"
                        className="rounded border border-red-500/60 px-3 py-1 text-xs text-red-200"
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
        {posts.length === 0 ? (
          <div className="px-4 py-6 text-sm text-neutral-400">{t.noPosts}</div>
        ) : null}
      </div>
    </div>
  )
}
