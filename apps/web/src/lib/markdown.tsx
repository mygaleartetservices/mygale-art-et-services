/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Components } from 'react-markdown'
import { defaultSchema } from 'rehype-sanitize'
import { visit } from 'unist-util-visit'

const baseTagNames = Array.isArray(defaultSchema.tagNames) ? defaultSchema.tagNames : []
const baseAttributes = defaultSchema.attributes ?? {}

export const markdownSanitizeSchema: any = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([
      ...baseTagNames,
      'img',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'code',
      'pre',
      'blockquote',
      'hr',
      'del',
      'kbd',
      'mark',
      'sup',
      'sub',
      'video',
      'source',
      'iframe',
    ])
  ),
  attributes: {
    ...baseAttributes,
    a: [...(baseAttributes.a ?? []), 'href', 'title', 'rel', 'target'],
    img: [...(baseAttributes.img ?? []), 'src', 'alt', 'title'],
    code: [...(baseAttributes.code ?? []), 'className'],
    pre: [...(baseAttributes.pre ?? []), 'className'],
    // Uploaded-file video: src always points at our own S3/proxy URL (same
    // trust level as img's src above), so no extra restriction is needed
    // beyond the allowed-attribute list itself.
    video: ['src', 'controls', 'poster', 'width', 'height', 'preload', 'muted', 'loop', 'playsinline'],
    source: ['src', 'type'],
    // Embedded video (YouTube/Vimeo): unlike img/video src, an iframe src
    // can point anywhere and would otherwise be a clickjacking/phishing
    // vector, so it's further restricted to a known-provider allowlist by
    // rehypeRestrictIframeEmbeds below — this attribute list alone is not
    // the security boundary.
    iframe: [
      'src',
      'title',
      'width',
      'height',
      'frameborder',
      'allow',
      'allowfullscreen',
      'referrerpolicy',
    ],
  },
}

// Keep in sync with rehypeRestrictIframeEmbeds below.
const ALLOWED_IFRAME_SRC_PREFIXES = [
  'https://www.youtube.com/embed/',
  'https://www.youtube-nocookie.com/embed/',
  'https://player.vimeo.com/video/',
]

/**
 * rehype-sanitize's schema can allowlist the `iframe` tag and its
 * attributes, but it has no way to restrict an attribute to a set of URL
 * *prefixes* (only exact enumerated values) — so on its own it would let a
 * blog author embed an iframe pointed at an arbitrary, attacker-controlled
 * URL. This plugin runs before sanitize and removes any iframe whose src
 * isn't a YouTube or Vimeo embed URL; sanitize then only has to decide
 * whether the (now trustworthy) remaining iframes are structurally well-formed.
 */
export function rehypeRestrictIframeEmbeds() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (node.tagName !== 'iframe' || !parent || typeof index !== 'number') return
      const src = node.properties?.src
      const allowed = typeof src === 'string' && ALLOWED_IFRAME_SRC_PREFIXES.some((p) => src.startsWith(p))
      if (!allowed) parent.children.splice(index, 1)
    })
  }
}

// Markdown headings are demoted one level (h1 -> h2, h2 -> h3, h3 -> h4) so
// user-authored content never introduces a second <h1> on a page that
// already has its own title heading — visual sizing is kept as-authored.
export const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h2 className="mt-10 text-3xl font-bold tracking-tight text-neutral-900" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h3 className="mt-8 text-2xl font-semibold tracking-tight text-neutral-900" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h4 className="mt-6 text-xl font-semibold text-neutral-900" {...props} />
  ),
  p: ({ node, ...props }) => (
    <p className="mt-4 leading-7 text-neutral-700" {...props} />
  ),
  a: ({ node, ...props }) => (
    <a className="text-[#003366] underline decoration-[#3399FF]/60 underline-offset-4" {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul className="mt-4 list-disc pl-6 text-neutral-700" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="mt-4 list-decimal pl-6 text-neutral-700" {...props} />
  ),
  li: ({ node, ...props }) => <li className="mt-1" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="mt-6 border-l-4 border-[#3399FF]/60 bg-[#F4F6F8] px-4 py-3 text-neutral-700"
      {...props}
    />
  ),
  code: ({ node, className, ...props }) => {
    const isInline = !className
    return (
      <code
        className={
          isInline
            ? 'rounded bg-neutral-100 px-1.5 py-0.5 text-[0.85em] text-neutral-900'
            : className
        }
        {...props}
      />
    )
  },
  pre: ({ node, ...props }) => (
    <pre className="mt-4 overflow-x-auto rounded-lg bg-neutral-900 p-4 text-neutral-100" {...props} />
  ),
  img: ({ node, ...props }) => (
    <img className="mt-6 rounded-lg border" {...props} alt={props.alt ?? ''} />
  ),
  video: ({ node, ...props }) => (
    <video className="mt-6 w-full rounded-lg border" {...props} />
  ),
  iframe: ({ node, ...props }) => (
    <iframe
      className="mt-6 aspect-video w-full rounded-lg border"
      allowFullScreen
      {...props}
    />
  ),
}
