import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

import config from '../src/payload.config'

type ContactData = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  contactType: 'player' | 'donor' | 'coach'
  program?: string
  citizenship?: string
  lineage?: string
  dateOfBirth?: string
  position?: string
  highSchool?: string
  college?: string
  graduationYear?: number
  professionalExperience?: string
  highlightTape?: string
  'parent-email'?: string
  'parent-phone'?: string
  involvement?: string
  coachingExperience?: string
  address?: {
    city?: string
    state?: string
    country?: string
  }
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
      if (currentLine.some((f) => f.trim())) lines.push(currentLine)
      currentLine = []
      currentField = ''
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      currentLine.push(currentField)
      if (currentLine.some((f) => f.trim())) lines.push(currentLine)
      currentLine = []
      currentField = ''
      i++
    } else {
      currentField += char
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField)
    if (currentLine.some((f) => f.trim())) lines.push(currentLine)
  }

  return lines
}

const clean = (value?: string) => (value || '').trim()

const mapProgram = (value: string) => {
  const map: Record<string, string> = {
    "Men's Player": 'mens',
    "Women's Player": 'womens',
    'Boys Youth Player': 'boys-youth',
    'Girls Youth Player': 'girls-youth',
    'Fundraising Commitee': 'fundraising',
    'Fundraising Committee': 'fundraising',
    'Donations/Sponsorship': 'donor',
    'Player Recruitment': 'donor',
    Coach: 'coaching',
  }
  return map[value] || ''
}

const mapLineage = (value: string) => {
  const normalized = value.toLowerCase().trim().replace(/\s+/g, ' ')
  if (!normalized) return ''
  if (normalized.includes('i am an italian citizen')) return 'italian-citizen'
  if (normalized === 'parent' || normalized.includes('my parent')) return 'parent'
  if (normalized.includes('great-grandmother')) return 'great-grandmother'
  if (normalized.includes('great-grandfather')) return 'great-grandfather'
  if (normalized.includes('great-grandparent')) return 'great-grandparent'
  if (normalized.includes('grandmother')) return 'grandmother'
  if (normalized.includes('grandfather')) return 'grandfather'
  if (normalized.includes('grandparent')) return 'grandparent'
  if (
    normalized === "i'm not sure" ||
    normalized === 'im not sure' ||
    normalized.includes('not sure')
  ) {
    return 'not-sure'
  }
  return ''
}

const mapPosition = (value: string) => {
  const map: Record<string, string> = {
    Attack: 'attack',
    Midfield: 'midfield',
    Defense: 'defense',
    'Close Defense': 'defense',
    Goalie: 'goalie',
    Faceoff: 'faceoff',
    'Face Off': 'faceoff',
    LSM: 'lsm',
  }
  return map[value] || ''
}

const mapCitizenship = (lineage: string) => {
  if (lineage === 'italian-citizen') return 'citizen'
  if (
    lineage === 'parent' ||
    lineage === 'grandparent' ||
    lineage === 'grandfather' ||
    lineage === 'grandmother' ||
    lineage === 'great-grandparent' ||
    lineage === 'great-grandfather' ||
    lineage === 'great-grandmother'
  ) {
    return 'pending'
  }
  if (lineage === 'not-sure') return 'not-a-citizen'
  return ''
}

const formatDate = (value: string) => {
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!match) return ''
  const [, month, day, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const toContact = (row: string[]): ContactData | null => {
  const interestRaw = clean(row[1])
  const isYouth = interestRaw.includes('Youth')
  const isCoach = interestRaw === 'Coach'
  const isDonor =
    interestRaw === 'Donations/Sponsorship' ||
    interestRaw === 'Fundraising Commitee' ||
    interestRaw === 'Fundraising Committee' ||
    interestRaw === 'Player Recruitment'

  const email = clean(row[4]).toLowerCase()
  if (!email || !email.includes('@')) return null

  const lineage = mapLineage(clean(row[6]))
  const dob = isYouth ? clean(row[17]) : clean(row[7])
  const positionRaw = isYouth ? clean(row[20]) : clean(row[8])
  const town = isYouth ? clean(row[21]) : clean(row[12])
  const state = isYouth ? clean(row[22]) : clean(row[13])
  const highSchool = isYouth ? clean(row[23]) : clean(row[9])
  const graduationYearRaw = clean(row[18])
  const graduationYear = graduationYearRaw ? Number.parseInt(graduationYearRaw, 10) : undefined

  const data: ContactData = {
    firstName: clean(row[2]),
    lastName: clean(row[3]),
    email,
    phone: clean(row[5]) || undefined,
    contactType: isCoach ? 'coach' : isDonor ? 'donor' : 'player',
    program: mapProgram(interestRaw) || undefined,
    citizenship: mapCitizenship(lineage) || undefined,
    lineage: lineage || undefined,
    dateOfBirth: formatDate(dob) || undefined,
    position: mapPosition(positionRaw) || undefined,
    highSchool: highSchool || undefined,
    college: clean(row[10]) || undefined,
    graduationYear: Number.isFinite(graduationYear) ? graduationYear : undefined,
    professionalExperience: clean(row[11]) || undefined,
    highlightTape: clean(row[15]) || undefined,
    'parent-email': clean(row[26]) || undefined,
    'parent-phone': clean(row[27]) || undefined,
    involvement: isDonor ? clean(row[29]) || undefined : undefined,
    coachingExperience: isCoach ? clean(row[30]) || undefined : undefined,
    address: {
      city: town || undefined,
      state: state || undefined,
      country: clean(row[14]) || 'USA',
    },
  }

  if (data.address && !data.address.city && !data.address.state && !data.address.country) {
    delete data.address
  }

  return data
}

const mergeContacts = (current: ContactData, next: ContactData): ContactData => {
  const out: ContactData = { ...current }

  for (const [key, value] of Object.entries(next) as [keyof ContactData, ContactData[keyof ContactData]][]) {
    if (key === 'address') {
      out.address = {
        ...(out.address || {}),
        ...(value || {}),
      }
      continue
    }

    if (
      out[key] == null ||
      out[key] === '' ||
      out[key] === 'not-sure' ||
      out[key] === 'not-a-citizen'
    ) {
      out[key] = value
    }
  }

  return out
}

const main = async () => {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.error('Usage: tsx tools/import-ilna-original.ts <ilna-csv-path> [--dry-run]')
    process.exit(1)
  }

  const dryRun = args.includes('--dry-run')
  const csvPath = path.resolve(args.find((arg) => !arg.startsWith('--')) || '')

  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`)
    process.exit(1)
  }

  const rows = parseCSV(fs.readFileSync(csvPath, 'utf8')).slice(1)
  const deduped = new Map<string, ContactData>()
  let skipped = 0

  for (const row of rows) {
    const mapped = toContact(row)
    if (!mapped) {
      skipped++
      continue
    }

    const existing = deduped.get(mapped.email)
    deduped.set(mapped.email, existing ? mergeContacts(existing, mapped) : mapped)
  }

  console.log(`Rows read: ${rows.length}`)
  console.log(`Unique valid contacts: ${deduped.size}`)
  console.log(`Skipped rows: ${skipped}`)

  if (dryRun) {
    console.log('Dry run complete. No DB changes made.')
    return
  }

  const payload = await getPayload({ config })
  let created = 0
  let updated = 0
  let failed = 0

  for (const contact of deduped.values()) {
    try {
      const existing = await payload.find({
        collection: 'contacts',
        where: { email: { equals: contact.email } },
        depth: 0,
        limit: 1,
      })

      if (existing.docs.length > 0) {
        await payload.update({
          collection: 'contacts',
          id: existing.docs[0].id,
          data: contact,
        })
        updated++
      } else {
        await payload.create({
          collection: 'contacts',
          data: contact,
        })
        created++
      }
    } catch (error) {
      failed++
      const message = error instanceof Error ? error.message : String(error)
      console.error(`Failed for ${contact.email}: ${message}`)
    }
  }

  console.log('Import complete')
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Failed: ${failed}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
