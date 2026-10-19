import type { Lang } from '@/lib/locale'

const GREETING: Record<Lang, string> = {
  fr: "Bonjour Mygale, j'aimerais vous parler d'un projet.",
  en: "Hello Mygale, I'd like to talk to you about a project.",
}

/** wa.me click-to-chat link with a pre-filled message (UX-14, WhatsApp-first). */
export function whatsappLink(number: string | null | undefined, lang: Lang, message?: string): string | null {
  if (!number) return null
  const digits = number.replace(/[^\d]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message ?? GREETING[lang])}`
}
