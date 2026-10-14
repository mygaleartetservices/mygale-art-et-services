import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import MarkdownRenderer from '@/components/MarkdownRenderer'

// Rendered per-request (like every other CMS-driven page in this app) rather
// than via generateStaticParams/ISR: the root layout reads the locale cookie,
// which conflicts with Next's on-demand-ISR-fallback rendering mode and
// throws DYNAMIC_SERVER_USAGE in production for any post not present in the
// static param set at build time — i.e. every post published after a deploy.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
  })

  if (!post) {
    return {
      title: 'Blog | Mygale Art & Services',
      description: 'Mygale Art & Services blog post.',
    }
  }

  const title = post.seoTitle || post.title
  const description = post.seoDescription || post.excerpt || ''

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImage ? [{ url: post.coverImage, alt: post.title }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.blogPost.findFirst({
    where: { slug, published: true },
    include: { category: true, tags: true },
  })

  if (!post) {
    notFound()
  }

  const translation = post.translationGroupId
    ? await prisma.blogPost.findFirst({
        where: {
          translationGroupId: post.translationGroupId,
          id: { not: post.id },
          published: true,
        },
        select: { slug: true, locale: true },
      })
    : null

  const dateLocale = post.locale === 'en' ? 'en-US' : 'fr-FR'

  return (
    <article className="bg-surface text-black">
      {post.coverImage && (
        <div className="relative h-80 md:h-105 w-full">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0">
            <div className="max-w-4xl mx-auto px-4 pb-10 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                {post.publishedAt
                  ? new Intl.DateTimeFormat(dateLocale, { dateStyle: 'long' }).format(
                      post.publishedAt,
                    )
                  : ''}
              </p>
              <h1 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
                {post.title}
              </h1>
              <p className="mt-4 text-white/85 max-w-3xl">{post.excerpt}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {!post.coverImage && (
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              {post.publishedAt
                ? new Intl.DateTimeFormat(dateLocale, { dateStyle: 'long' }).format(
                    post.publishedAt,
                  )
                : ''}
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold leading-tight text-neutral-900">
              {post.title}
            </h1>
            {post.excerpt ? <p className="mt-4 text-ink-muted max-w-3xl">{post.excerpt}</p> : null}
          </header>
        )}

        {post.category || post.tags.length > 0 || translation ? (
          <div className="mb-8 flex flex-wrap items-center gap-2 text-xs">
            {post.category ? (
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-ink">
                {post.locale === 'en' ? post.category.nameEn : post.category.nameFr}
              </span>
            ) : null}
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-full border px-3 py-1 text-ink-muted">
                #{post.locale === 'en' ? tag.nameEn : tag.nameFr}
              </span>
            ))}
            {translation ? (
              <Link
                href={`/blog/${translation.slug}`}
                className="ml-auto rounded-full border border-primary px-3 py-1 font-semibold text-ink hover:bg-primary hover:text-white transition"
              >
                {translation.locale === 'en' ? 'Read in English' : 'Lire en français'}
              </Link>
            ) : null}
          </div>
        ) : null}

        <MarkdownRenderer content={post.content} />

        <div className="mt-12 border-t pt-6">
          <Link href={`/blog?lang=${post.locale}`} className="text-sm font-semibold text-ink">
            {'<- Back to Blog'}
          </Link>
        </div>
      </div>
    </article>
  )
}
