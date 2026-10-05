'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { markdownComponents, markdownSanitizeSchema, rehypeRestrictIframeEmbeds } from '@/lib/markdown'

export default function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw,
        rehypeRestrictIframeEmbeds,
        [rehypeSanitize, markdownSanitizeSchema],
      ]}
      components={markdownComponents}
    >
      {content}
    </ReactMarkdown>
  )
}
