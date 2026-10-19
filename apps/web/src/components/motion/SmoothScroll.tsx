'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Storytelling pages only (DS-3). Contact, blog, auth and admin keep native
// scrolling: inertia reads as lag on task screens.
function isSmoothRoute(pathname: string) {
  return pathname === '/' || pathname === '/about' || pathname === '/services' || pathname.startsWith('/services/')
}

export default function SmoothScroll() {
  const pathname = usePathname() ?? '/'

  useEffect(() => {
    if (!isSmoothRoute(pathname)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis({ lerp: 0.11, anchors: { offset: -80 }, allowNestedScroll: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
    }
  }, [pathname])

  return null
}
