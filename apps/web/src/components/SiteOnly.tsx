'use client'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Renders its children on the public site only. The admin has its own shell
 * (src/app/admin/layout.tsx); the public header, footer, announcement
 * banner and smooth scrolling used to render around it too, so the
 * dashboard showed the marketing navbar and footer and its sidebar could not
 * stay put. A client check keeps public pages static (reading request
 * headers in the root layout would make every page dynamic).
 */
export default function SiteOnly({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}
