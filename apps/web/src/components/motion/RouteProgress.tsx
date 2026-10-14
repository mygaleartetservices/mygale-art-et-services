'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/animations'

/**
 * Thin cobalt bar during client-side navigation. Same-page hash links never
 * trigger it (DS-6), and it always completes when the pathname changes.
 * Replaces the old full-page fade that blanked every page on navigation.
 */
export default function RouteProgress() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [lastPathname, setLastPathname] = useState(pathname)

  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setActive(false)
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      setActive(true)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-progress"
          className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0.85, transition: { duration: 2.4, ease: EASE_OUT } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.25 } }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  )
}
