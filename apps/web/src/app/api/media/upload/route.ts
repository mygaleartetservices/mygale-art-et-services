import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/prisma'

const ROLE_RANK: Record<string, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  EDITOR: 3,
  STAFF: 2,
  VIEWER: 1,
  USER: 0,
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.mygaleartetservices.org'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET = process.env.AWS_S3_BUCKET || ''
const THUMBNAIL_WIDTH = 400

// Whitelist of accepted upload types. Extension is derived from the MIME
// type (not trusted from the client-supplied filename) so a mismatched
// extension can't be used to smuggle an unexpected file type past storage.
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
}

// Folder is a caller-supplied logical prefix for the S3 key. Restrict it to
// a small safe character set and reject path traversal / absolute paths so
// it can't be used to write outside the intended prefix or across folders.
const FOLDER_PATTERN = /^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/
const MAX_FOLDER_LENGTH = 128

function isSafeFolder(folder: string): boolean {
  if (!folder || folder.length > MAX_FOLDER_LENGTH) return false
  if (folder.startsWith('/') || folder.startsWith('\\')) return false
  if (folder.includes('..')) return false
  return FOLDER_PATTERN.test(folder)
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': FRONTEND_URL,
  }
}

// Every uploaded file here is public site content (service photos, homepage
// images, blog covers, logos) — the same public pages later render this
// exact URL to anonymous visitors, with no session to attach a signature or
// cookie to. The CloudFront distribution in front of the bucket is
// configured to require a signed cookie/URL on these objects regardless, and
// generating that signature is currently broken in production — so instead
// of depending on CloudFront (or on it being configured correctly) at all,
// point at this app's own same-origin proxy route, which fetches the object
// straight from S3 with credentials already proven to work for uploads.
function resolveUrl(key: string) {
  return `/api/media/file/${key}`
}

async function putObject(key: string, body: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }),
  )
}

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user || !user.role || ROLE_RANK[user.role] < ROLE_RANK.EDITOR) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders() })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'uploads'
  const altFr = (formData.get('altFr') as string) || null
  const altEn = (formData.get('altEn') as string) || null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders() })
  }

  if (!isSafeFolder(folder)) {
    return NextResponse.json(
      { error: 'Invalid folder path' },
      { status: 400, headers: corsHeaders() },
    )
  }

  const ext = ALLOWED_MIME_TO_EXT[file.type]
  if (!ext) {
    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 400, headers: corsHeaders() },
    )
  }

  const timestamp = Date.now()
  const key = `${folder}/${timestamp}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const isImage = file.type.startsWith('image/')

  let width: number | undefined
  let height: number | undefined
  let thumbnailKey: string | undefined
  let webpKey: string | undefined

  try {
    await putObject(key, buffer, file.type)

    if (isImage) {
      try {
        const image = sharp(buffer)
        const metadata = await image.metadata()
        width = metadata.width
        height = metadata.height

        const thumbnailBuffer = await sharp(buffer)
          .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
          .toBuffer()
        thumbnailKey = `${folder}/${timestamp}-thumb.${ext}`
        await putObject(thumbnailKey, thumbnailBuffer, file.type)

        const webpBuffer = await sharp(buffer).webp({ quality: 82 }).toBuffer()
        webpKey = `${folder}/${timestamp}.webp`
        await putObject(webpKey, webpBuffer, 'image/webp')
      } catch (err) {
        // Non-fatal: original upload already succeeded, thumbnail/webp are best-effort.
        console.error('Thumbnail/WebP generation failed', err)
      }
    }
  } catch (err) {
    console.error('S3 upload error', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500, headers: corsHeaders() })
  }

  const url = resolveUrl(key)
  const thumbnailUrl = thumbnailKey ? resolveUrl(thumbnailKey) : null
  const webpUrl = webpKey ? resolveUrl(webpKey) : null

  const media = await prisma.media.upsert({
    where: { key },
    update: { url, thumbnailUrl, webpUrl, width, height, mimeType: file.type, size: buffer.length },
    create: {
      key,
      url,
      thumbnailUrl,
      webpUrl,
      width,
      height,
      mimeType: file.type,
      size: buffer.length,
      folder,
      altFr,
      altEn,
      uploadedById: user.id,
    },
  })

  return NextResponse.json(
    { ok: true, key, url, thumbnailUrl, webpUrl, mediaId: media.id },
    { headers: corsHeaders() },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': FRONTEND_URL,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
