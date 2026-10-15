import type { Lang } from '@/lib/locale'

/**
 * Dates in the admin, in the admin's language. Pages used to hardcode
 * 'en-US', so the French admin read "Oct 15, 2026, 6:27 AM".
 */
export function formatAdminDate(value: Date | string, lang: Lang, withTime = true): string {
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    ...(withTime ? { timeStyle: 'short' } : {}),
  }).format(new Date(value))
}
