import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../src/payload.config'

type LineageValue =
  | 'italian-citizen'
  | 'parent'
  | 'grandparent'
  | 'grandfather'
  | 'grandmother'
  | 'great-grandparent'
  | 'great-grandfather'
  | 'great-grandmother'
  | 'not-sure'

const validLineageValues = new Set<LineageValue>([
  'italian-citizen',
  'parent',
  'grandparent',
  'grandfather',
  'grandmother',
  'great-grandparent',
  'great-grandfather',
  'great-grandmother',
  'not-sure',
])

const mapLineage = (value?: string): LineageValue | '' => {
  if (!value) return ''

  const normalized = value.toLowerCase().trim().replace(/\s+/g, ' ')
  if (!normalized) return ''

  if (validLineageValues.has(normalized as LineageValue)) return normalized as LineageValue
  if (normalized.includes('i am an italian citizen')) return 'italian-citizen'
  if (normalized === 'parent' || normalized.includes('my parent')) return 'parent'
  if (normalized.includes('great-grandmother') || normalized.includes('great grandmother')) {
    return 'great-grandmother'
  }
  if (normalized.includes('great-grandfather') || normalized.includes('great grandfather')) {
    return 'great-grandfather'
  }
  if (normalized.includes('great-grandparent') || normalized.includes('great grandparent')) {
    return 'great-grandparent'
  }
  if (normalized.includes('grandmother') || normalized.includes('grand mother')) return 'grandmother'
  if (normalized.includes('grandfather') || normalized.includes('grand father')) return 'grandfather'
  if (normalized.includes('grandparent') || normalized.includes('grand parent')) return 'grandparent'
  if (
    normalized === "i'm not sure" ||
    normalized === 'im not sure' ||
    normalized.includes('not sure')
  ) {
    return 'not-sure'
  }

  return ''
}

const mapCitizenship = (lineage: LineageValue): 'citizen' | 'pending' | 'not-a-citizen' => {
  if (lineage === 'italian-citizen') return 'citizen'
  if (lineage === 'not-sure') return 'not-a-citizen'

  return 'pending'
}

const parseCSV = (text: string): string[][] => {
  const lines: string[][] = []
  let currentLine: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField)
      currentField = ''
    } else if (char === '\n' && !inQuotes) {
      currentLine.push(currentField)
      if (currentLine.some((f) => f.trim())) {
        lines.push(currentLine)
      }
      currentLine = []
      currentField = ''
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      currentLine.push(currentField)
      if (currentLine.some((f) => f.trim())) {
        lines.push(currentLine)
      }
      currentLine = []
      currentField = ''
      i++
    } else {
      currentField += char
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField)
    if (currentLine.some((f) => f.trim())) {
      lines.push(currentLine)
    }
  }

  return lines
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const csvArg = args.find((arg) => !arg.startsWith('--'))

if (!csvArg) {
  console.error('Usage: tsx tools/reconcile-lineage-from-ready-csv.ts <ready-csv-path> [--dry-run]')
  process.exit(1)
}

const csvPath = path.resolve(csvArg)
if (!fs.existsSync(csvPath)) {
  console.error(`File not found: ${csvPath}`)
  process.exit(1)
}

const csvText = fs.readFileSync(csvPath, 'utf-8')
const lines = parseCSV(csvText)
if (lines.length < 2) {
  console.error('CSV file has no data rows')
  process.exit(1)
}

const headers = lines[0].map((h) => h.trim())
const emailIdx = headers.indexOf('email')
const lineageIdx = headers.indexOf('lineage')
if (emailIdx === -1 || lineageIdx === -1) {
  console.error('CSV must include "email" and "lineage" columns')
  process.exit(1)
}

const rows = lines.slice(1)
const lineageByEmail = new Map<string, { lineage: LineageValue; rowNum: number; raw: string }>()
const unmappedLineage = new Map<string, number>()
let conflictingRows = 0

for (let i = 0; i < rows.length; i++) {
  const row = rows[i]
  const rowNum = i + 2
  const email = (row[emailIdx] || '').trim().toLowerCase()
  const rawLineage = (row[lineageIdx] || '').trim()
  const lineage = mapLineage(rawLineage)

  if (!email || !email.includes('@')) continue
  if (!lineage) {
    if (rawLineage) {
      unmappedLineage.set(rawLineage, (unmappedLineage.get(rawLineage) || 0) + 1)
    }
    continue
  }

  const existing = lineageByEmail.get(email)
  if (existing && existing.lineage !== lineage) {
    conflictingRows++
    continue
  }

  lineageByEmail.set(email, { lineage, rowNum, raw: rawLineage })
}

const payload = await getPayload({ config })

const contactsByEmail = new Map<
  string,
  { id: number | string; email?: string; lineage?: string | null; citizenship?: string | null }
>()

let page = 1
const limit = 500
for (;;) {
  const result = await payload.find({
    collection: 'contacts',
    depth: 0,
    limit,
    page,
    select: {
      id: true,
      email: true,
      lineage: true,
      citizenship: true,
    },
  })

  for (const doc of result.docs) {
    if (doc.email) contactsByEmail.set(doc.email.toLowerCase(), doc)
  }

  if (!result.hasNextPage) break
  page++
}

let matchedContacts = 0
let updatedContacts = 0
let unchangedContacts = 0
let missingContacts = 0

for (const [email, source] of lineageByEmail.entries()) {
  const contact = contactsByEmail.get(email)
  if (!contact) {
    missingContacts++
    continue
  }

  matchedContacts++
  const nextCitizenship = mapCitizenship(source.lineage)
  const lineageChanged = (contact.lineage || '') !== source.lineage
  const citizenshipChanged = (contact.citizenship || '') !== nextCitizenship

  if (!lineageChanged && !citizenshipChanged) {
    unchangedContacts++
    continue
  }

  updatedContacts++
  if (!dryRun) {
    await payload.update({
      collection: 'contacts',
      id: contact.id,
      data: {
        lineage: source.lineage,
        citizenship: nextCitizenship,
      },
    })
  }
}

console.log('\nLineage reconcile (ready CSV) summary')
console.log(`- Mode: ${dryRun ? 'dry-run' : 'write'}`)
console.log(`- Source rows with mapped lineage: ${lineageByEmail.size}`)
console.log(`- Matching contacts found: ${matchedContacts}`)
console.log(`- Contacts to update: ${updatedContacts}`)
console.log(`- Contacts already correct: ${unchangedContacts}`)
console.log(`- Source emails not found in contacts: ${missingContacts}`)
console.log(`- Conflicting duplicate source rows skipped: ${conflictingRows}`)

if (unmappedLineage.size > 0) {
  console.log('\nUnmapped source lineage answers (skipped):')
  ;[...unmappedLineage.entries()]
    .sort((a, b) => b[1] - a[1])
    .forEach(([value, count]) => {
      console.log(`- "${value}" (${count})`)
    })
}

if (dryRun) {
  console.log('\nNo DB writes were made.')
}
