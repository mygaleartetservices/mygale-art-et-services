import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import type { Role, User } from '@prisma/client'

const ROLE_RANK: Record<Role, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  STAFF: 2,
  VIEWER: 1,
  USER: 0,
}

const SESSION_COOKIE_NAMES = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
  'session-token',
  'session',
]

async function getSessionToken() {
  const jar = await cookies()
  for (const name of SESSION_COOKIE_NAMES) {
    const value = jar.get(name)?.value
    if (value) return value
  }
  return null
}

export async function getCurrentUser(): Promise<User | null> {
  const token = await getSessionToken()
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session?.user) return null
  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } })
    return null
  }
  if (!session.user.active) return null
  return session.user
}

export async function requireRole(minRole: Role): Promise<User> {
  const user = await getCurrentUser()
  if (!user || !user.role || ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    // Send the visitor back to the exact page they were trying to reach
    // (query string included) once they've logged in — see signInWithPassword
    // in app/auth/actions.ts, which reads this back out. Without it, a QR
    // check-in link opened while logged out loses its token: the employee
    // lands on the bare /admin dashboard post-login instead of the check-in
    // button they scanned for.
    const headerStore = await headers()
    const returnTo = headerStore.get('x-pathname')
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : '/login')
  }
  return user
}

export async function requireAdmin(): Promise<User> {
  return requireRole('ADMIN')
}
