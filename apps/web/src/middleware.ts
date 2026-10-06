import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { OVERVIEW_SECTION_KEY } from '@/lib/adminPages'

export const config = {
  runtime: 'nodejs',
}

type RedirectEntry = { toPath: string; statusCode: number }

let cache: { map: Map<string, RedirectEntry>; expiresAt: number } | null = null
const TTL_MS = 60_000

async function getRedirectMap() {
  if (cache && cache.expiresAt > Date.now()) return cache.map

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('DB timeout')), 2000),
  )
  const redirects = await Promise.race([
    prisma.redirect.findMany({ where: { active: true } }),
    timeout,
  ])
  const map = new Map<string, RedirectEntry>(
    redirects.map((r) => [r.fromPath, { toPath: r.toPath, statusCode: r.statusCode }]),
  )
  cache = { map, expiresAt: Date.now() + TTL_MS }
  return map
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Admin routes: no redirect lookup needed, but stamp which section is being
  // requested so admin/layout.tsx can check per-user page access centrally
  // without every page needing to read the pathname itself.
  if (pathname.startsWith('/admin')) {
    const section = pathname.split('/').filter(Boolean)[1] ?? OVERVIEW_SECTION_KEY
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-admin-section', section)
    // Lets requireRole() send an unauthenticated visitor back to the exact
    // page (and query string — e.g. a QR check-in token) they were trying
    // to reach, instead of always bouncing to the bare /admin dashboard.
    requestHeaders.set('x-pathname', pathname + req.nextUrl.search)
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // Redirects only apply to public content paths — skip api/static assets entirely.
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  try {
    const map = await getRedirectMap()
    const match = map.get(pathname)
    if (match) {
      const url = req.nextUrl.clone()
      if (match.toPath.startsWith('http://') || match.toPath.startsWith('https://')) {
        return NextResponse.redirect(match.toPath, match.statusCode)
      }
      url.pathname = match.toPath
      return NextResponse.redirect(url, match.statusCode)
    }
  } catch (err) {
    // Redirect lookup is best-effort — never block a request because the DB hiccuped.
    console.error('Redirect lookup failed', err)
  }

  return NextResponse.next()
}
