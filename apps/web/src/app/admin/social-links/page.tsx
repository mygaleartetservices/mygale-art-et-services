import Link from 'next/link'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { getAdminT } from '@/lib/getLocale'
import SocialLinksTable from './SocialLinksTable'

export default async function AdminSocialLinksPage() {
  await requireRole('ADMIN')
  const [links, adminT] = await Promise.all([
    prisma.socialLink.findMany({
      where: { deletedAt: null },
      orderBy: { order: 'asc' },
    }),
    getAdminT(),
  ])
  const t = adminT.socialLinks

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-neutral-400">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/social-links/new"
          className="rounded-lg bg-[#1f44c9] text-white hover:bg-[#1937a6] px-4 py-2 text-sm font-semibold"
        >
          {t.newLink}
        </Link>
      </div>

      <SocialLinksTable links={links} />
    </div>
  )
}
