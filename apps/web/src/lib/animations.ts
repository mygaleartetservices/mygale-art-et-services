import type { Variants } from 'framer-motion'

/**
 * Central motion system (DS-3). Timing follows UX-11: feedback 100-300ms,
 * reveals ~550ms ease-out, exits ~25% faster. Reduced motion is handled
 * globally by MotionConfig (components/motion/MotionProvider.tsx).
 */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const
export const EASE_EXIT = [0.4, 0, 1, 1] as const

const reveal = { duration: 0.55, ease: EASE_OUT }

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: reveal },
}
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: reveal },
}
export const fadeRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: reveal },
}
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
}
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
}
/** A word of display type rising out of its own mask. */
export const maskWord: Variants = {
  hidden: { y: '110%' },
  visible: { y: '0%' },
}
export const drawerFromRight: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { x: '100%', transition: { duration: 0.22, ease: EASE_EXIT } },
}
export const popover: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.13, ease: EASE_EXIT } },
}
