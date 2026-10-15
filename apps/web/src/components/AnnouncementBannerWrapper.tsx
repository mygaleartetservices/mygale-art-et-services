'use client'

import { useEffect, useState } from 'react'
import AnnouncementBannerClient from '@/components/AnnouncementBannerClient'

type AnnouncementData = {
  id: string
  title: string
  message: string
  imageUrl?: string | null
  type: 'info' | 'warning' | 'promo' | 'success' | 'error'
  dismissible: boolean
}

export default function AnnouncementBannerWrapper() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    // State is only set from the promise callbacks (never synchronously in
    // the effect), and never after unmount.
    const load = () =>
      fetch('/api/announcements/current', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      })
        .then((response) => (response.ok ? (response.json() as Promise<AnnouncementData | null>) : null))
        .catch((error) => {
          console.error('Failed to fetch announcement:', error)
          return null
        })
        .then((data) => {
          if (cancelled) return
          setAnnouncement(data)
          setLoaded(true)
        })

    load()
    // Poll every 30 seconds to catch schedule changes.
    const interval = setInterval(load, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!loaded) {
    // Return null while loading to avoid layout shift
    return null
  }

  if (!announcement) {
    return null
  }

  return <AnnouncementBannerClient announcement={announcement} />
}
