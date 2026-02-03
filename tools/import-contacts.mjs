import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const csvArg = process.argv.find((arg) => arg.endsWith('.csv'))
const CSV_PATH = csvArg ? path.resolve(csvArg) : path.resolve(__dirname, '..', 'contacts-transformed.csv')

// Parse a single CSV line, respecting quoted fields (handles commas inside quotes)
function parseLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
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

// Parse CSV into array of objects with type coercion and dot-notation nesting
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
        const raw = (values[i] ?? '').trim()

        if (!raw || raw === 'N/A') return

        let value = raw

        // graduationYear is a number field in the schema
        if (header === 'graduationYear') {
          const num = Number(value)
          if (isNaN(num)) return
          value = num
        }

        // dateOfBirth is a date field — ensure full ISO string for SQLite adapter
        if (header === 'dateOfBirth') {
          value = new Date(value + 'T00:00:00.000Z').toISOString()
        }

        // Nest dot-notation headers into objects (e.g., address.city → { address: { city } })
        if (header.includes('.')) {
          const [parent, child] = header.split('.')
          if (!obj[parent]) obj[parent] = {}
          obj[parent][child] = value
        } else {
          obj[header] = value
        }
      })

      return obj
    })
}

console.log('Starting contact import...')

const csvText = fs.readFileSync(CSV_PATH, 'utf-8')
const contacts = parseCSV(csvText)

console.log(`Found ${contacts.length} contacts to import\n`)

// --dry-run: print parsed objects and exit before touching the DB
if (process.argv.includes('--dry-run')) {
  contacts.forEach((c, i) => {
    console.log(`[${i + 1}] ${c.firstName} ${c.lastName} <${c.email}>`)
    console.log(JSON.stringify(c, null, 2))
    console.log()
  })
  console.log('Dry run complete. Remove --dry-run to import.')
  process.exit(0)
}

const payload = await getPayload({ config })

let created = 0
let updated = 0
let failed = 0
const errors = []

for (const contact of contacts) {
  const label = `${contact.firstName} ${contact.lastName} <${contact.email}>`

  // Drop empty address groups so Payload doesn't complain about an empty object
  if (contact.address && Object.keys(contact.address).length === 0) {
    delete contact.address
  }

  try {
    // Check if a contact with this email already exists
    const { docs } = await payload.find({
      collection: 'contacts',
      where: { email: { equals: contact.email } },
      limit: 1,
    })

    if (docs.length > 0) {
      console.log(`Updating: ${label}`)
      await payload.update({
        collection: 'contacts',
        id: docs[0].id,
        data: contact,
      })
      updated++
      console.log(`  ✓ Updated`)
    } else {
      console.log(`Creating: ${label}`)
      await payload.create({
        collection: 'contacts',
        data: contact,
      })
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
