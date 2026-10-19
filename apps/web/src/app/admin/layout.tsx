import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { Toaster } from 'react-hot-toast'
import { requireRole } from '@/lib/auth'
import { hasPageAccess, OVERVIEW_SECTION_KEY } from '@/lib/adminPages'
import { getUnreadContactCount } from '@/lib/queries/contactSubmissions'
import { getAdminT } from '@/lib/getLocale'
import AdminSidebar from '@/components/AdminSidebar'

export const metadata = {
  title: 'Admin | Mygale Art & Services',
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Any active account with a role can open the admin shell — which pages
  // they actually see is entirely down to hasPageAccess() below (their role
  // rank by default, or an explicit per-user grant for restricted accounts).
  // Individual write actions that need EDITOR/ADMIN still gate themselves.
  const user = await requireRole('USER')

  const section = (await headers()).get('x-admin-section') ?? OVERVIEW_SECTION_KEY
  const allowed = hasPageAccess(user, section)
  const unreadContactCount = hasPageAccess(user, 'contact-submissions')
    ? await getUnreadContactCount()
    : 0
  const t = await getAdminT()

  return (
    <div className="admin-theme min-h-dvh bg-neutral-950 text-white md:flex">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-neutral-950"
      >
        {t.nav.skipToContent}
      </a>
      <Toaster position="bottom-right" toastOptions={{ duration: 5000 }} />
      <AdminSidebar
        user={{
          name: user.name,
          role: user.role,
          pagesRestricted: user.pagesRestricted,
          allowedPages: user.allowedPages,
        }}
        unreadContactCount={unreadContactCount}
      />
      <div id="admin-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 md:px-10 md:py-10">
        <div className="mx-auto max-w-6xl">
          {allowed ? (
            children
          ) : (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <h1 className="text-lg font-semibold">{t.layout.noAccessTitle}</h1>
              <p className="mt-2 text-sm text-neutral-400">{t.layout.noAccessBody}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
