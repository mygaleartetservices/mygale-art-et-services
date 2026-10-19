'use client'

import { MotionConfig } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * reducedMotion="user": transforms become instant for visitors who ask for
 * reduced motion while opacity still fades, with no render-time branching
 * (so server and client markup match).
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
