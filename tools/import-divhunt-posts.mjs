import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvArg = process.argv.find((arg) => arg.endsWith('.csv'))
const CSV_PATH = csvArg ? path.resolve(csvArg) : null
const DRY_RUN = process.argv.includes('--dry-run')

if (!CSV_PATH) {
  console.error('Usage: pnpm import:divhunt-posts <path-to-export.csv> [--dry-run]')
  process.exit(1)
}

// Parse a single CSV line, respecting quoted fields (handles commas inside quotes)
function parseLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

// Split CSV text into logical rows, respecting quoted fields that span newlines
function splitRows(text) {
  const rows = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if (char === '\n' && !inQuotes) {
      if (current.trim()) rows.push(current)
      current = ''
    } else if (char === '\r') {
      // skip bare \r (CRLF handled by the \n branch)
    } else {
      current += char
    }
  }
  if (current.trim()) rows.push(current)
  return rows
}

function parseCSV(text) {
  const lines = splitRows(text)
  const headers = parseLine(lines[0])

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = parseLine(line)
      const obj = {}
      headers.forEach((header, i) => {
        obj[header] = (values[i] ?? '').trim()
      })
      return obj
    })
}

// Recursively locate a field config by name inside a (possibly tabbed/grouped) fields array
function findField(fields, name) {
  for (const field of fields || []) {
    if (field.name === name) return field
    if (field.type === 'tabs' && field.tabs) {
      for (const tab of field.tabs) {
        const found = findField(tab.fields, name)
        if (found) return found
      }
    }
    if (field.fields) {
      const found = findField(field.fields, name)
      if (found) return found
    }
  }
  return null
}

// convertHTMLToLexical reads media IDs from HTML attributes, which are always
// strings — but the D1/SQLite adapter expects a numeric upload node `value`.
function fixUploadNodeIds(node) {
  if (!node || typeof node !== 'object') return
  if (node.type === 'upload' && typeof node.value === 'string' && /^\d+$/.test(node.value)) {
    node.value = Number(node.value)
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) fixUploadNodeIds(child)
  }
}

function parsePublishedAt(dateStr) {
  if (!dateStr) return undefined
  // Divhunt export has no timezone info (e.g. "2026-07-16 18:18:00") — treated as UTC.
  const d = new Date(dateStr.replace(' ', 'T') + 'Z')
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

console.log('Starting Divhunt posts import...')

const csvText = fs.readFileSync(CSV_PATH, 'utf-8')
const rows = parseCSV(csvText)

console.log(`Found ${rows.length} posts to import\n`)

if (DRY_RUN) {
  rows.forEach((r, i) => {
    const inlineImages = (r.content.match(/<img/g) || []).length
    console.log(
      `[${i + 1}] "${r.name}" | slug=${r.slug} | publish=${r['publish-date']} | ` +
        `cover=${r['cover-image'] ? 'yes' : 'no'} | inline images=${inlineImages} | ` +
        `attribution=${r['photo-attribution'] || '(none)'}`,
    )
  })
  console.log('\nDry run complete. Remove --dry-run to import.')
  process.exit(0)
}

const payload = await getPayload({ config })

const postsConfig = payload.collections['posts']?.config
if (!postsConfig) throw new Error("Could not find sanitized 'posts' collection config")

const contentField = findField(postsConfig.fields, 'content')
if (!contentField) throw new Error("Could not find 'content' field on Posts collection")

const editorConfig = editorConfigFactory.fromField({ field: contentField })

// Cache downloaded/uploaded images by source URL so repeated images aren't re-uploaded
const imageCache = new Map()

async function downloadAndUpload(url, altText) {
  if (imageCache.has(url)) return imageCache.get(url)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download image (${res.status}): ${url}`)

  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const extFromType = contentType.split('/')[1]?.split(';')[0] || 'jpg'
  const baseName = path.basename(new URL(url).pathname) || `image.${extFromType}`
  const filename = baseName.includes('.') ? baseName : `${baseName}.${extFromType}`

  // Reuse media uploaded by a previous run (Divhunt filenames are content-hashed)
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    imageCache.set(url, existing.docs[0].id)
    return existing.docs[0].id
  }

  const media = await payload.create({
    collection: 'media',
    data: { alt: altText },
    file: {
      // Local Miniflare/R2 proxy fails to serialize a Node Buffer across the
      // devalue boundary; a plain Uint8Array works.
      data: new Uint8Array(buffer),
      mimetype: contentType,
      name: filename,
      size: buffer.length,
    },
  })

  imageCache.set(url, media.id)
  return media.id
}

let created = 0
let updated = 0
let failed = 0
const errors = []

for (const row of rows) {
  const label = `"${row.name}" (${row.slug})`

  try {
    console.log(`Processing: ${label}`)

    let heroImageId
    if (row['cover-image']) {
      heroImageId = await downloadAndUpload(row['cover-image'], row.name)
    }

    // Rewrite inline <img> tags with resolved Payload media IDs before HTML->Lexical
    // conversion, matching the attributes UploadServerNode.importDOM() expects.
    const dom = new JSDOM(row.content)
    const imgs = Array.from(dom.window.document.querySelectorAll('img'))
    for (const img of imgs) {
      const src = img.getAttribute('src')
      if (!src) continue
      const mediaId = await downloadAndUpload(src, `${row.name} - inline image`)
      img.setAttribute('data-lexical-upload-id', String(mediaId))
      img.setAttribute('data-lexical-upload-relation-to', 'media')
    }
    const processedHtml = dom.window.document.body.innerHTML

    const content = convertHTMLToLexical({ editorConfig, html: processedHtml, JSDOM })
    fixUploadNodeIds(content.root)

    // No slug passed — the slugField hook generates one from the title on create.
    // _status must be set explicitly: on update, draft:false alone keeps prior status.
    const data = {
      title: row.name,
      content,
      publishedAt: parsePublishedAt(row['publish-date']),
      _status: 'published',
    }
    if (heroImageId) data.heroImage = heroImageId
    if (row['photo-attribution']) data.photoAttribution = row['photo-attribution']

    // Match by title since slugs are auto-generated, not taken from the CSV
    const { docs } = await payload.find({
      collection: 'posts',
      where: { title: { equals: row.name } },
      limit: 1,
    })

    if (docs.length > 0) {
      await payload.update({ collection: 'posts', id: docs[0].id, data, draft: false })
      updated++
      console.log(`  ✓ Updated`)
    } else {
      await payload.create({ collection: 'posts', data, draft: false })
      created++
      console.log(`  ✓ Created`)
    }
  } catch (error) {
    failed++
    console.error(`  ✗ ${error.message}`)
    errors.push({ label, error: error.message })
  }
}

console.log(`\nDone — ${created} created, ${updated} updated, ${failed} failed`)

if (errors.length > 0) {
  console.log('\nFailures:')
  errors.forEach((e) => console.log(`  ${e.label}: ${e.error}`))
}

process.exit(failed > 0 ? 1 : 0)
