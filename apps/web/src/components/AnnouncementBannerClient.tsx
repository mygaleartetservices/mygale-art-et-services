/* eslint-disable react-hooks/set-state-in-effect */
'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'mygale-announcement-dismissed'

type AnnouncementData = {
  id: string
  title: string
  message: string
  imageUrl?: string | null
  type: 'info' | 'warning' | 'promo' | 'success' | 'error'
  dismissible: boolean
}

const typeStyles: Record<AnnouncementData['type'], string> = {
  info: 'bg-[#E6F1FF] text-ink border-[#3399FF]/40',
  warning: 'bg-[#FFF7E6] text-[#7A4B00] border-[#F59E0B]/40',
  promo: 'bg-[#ECFDF3] text-[#0F5132] border-[#22C55E]/40',
  success: 'bg-[#ECFDF3] text-[#0F5132] border-[#22C55E]/40',
  error: 'bg-[#FEF2F2] text-[#7F1D1D] border-[#EF4444]/40',
}

export default function AnnouncementBannerClient({
  announcement,
}: {
  announcement: AnnouncementData
}) {
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load dismissed state from localStorage
    if (typeof window !== 'undefined') {
      try {
        setDismissedId(window.localStorage.getItem(STORAGE_KEY))
      } catch {
        // Ignore localStorage errors
      }
    }
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  const isDismissed = announcement.dismissible && dismissedId === announcement.id
  const isVisible = !isDismissed

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, announcement.id)
      setDismissedId(announcement.id)
    } catch {
      setDismissedId(announcement.id)
    }
  }

  return (
    <div className="w-full" aria-hidden={!isVisible} suppressHydrationWarning>
      <div
        className={`min-h-12 border-b px-4 py-3 transition-opacity ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${typeStyles[announcement.type]}`}
        role="status"
        aria-live="polite"
      >
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {announcement.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={announcement.imageUrl}
                alt="Announcement"
                className="h-16 w-16 shrink-0 rounded object-cover"
                onError={(e) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('Announcement image failed to load')
                  }
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold tracking-wide">{announcement.title}</p>
              <p className="text-sm opacity-90 wrap-break-words">{announcement.message}</p>
            </div>
          </div>

          {announcement.dismissible ? (
            <button
              type="button"
              className="rounded border border-current/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider shrink-0"
              aria-label="Dismiss announcement"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
