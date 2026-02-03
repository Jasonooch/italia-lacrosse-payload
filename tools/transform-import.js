#!/usr/bin/env node

/**
 * Transform Google Form CSV export to Payload CMS format
 *
 * Usage: node tools/transform-import.js <input.csv> <output.csv>
 * Example: node tools/transform-import.js ~/Desktop/test-import.csv ./contacts-ready.csv
 */

import fs from 'fs'
import path from 'path'

// Value mapping functions
const mapProgram = (value) => {
  if (!value) return ''
  const map = {
    "Men's Player": 'mens',
    "Women's Player": 'womens',
    "Boys Youth Player": 'boys-youth',
    "Girls Youth Player": 'girls-youth',
    "Fundraising Commitee":  'fundraising',
    "Fundraising Committee": 'fundraising',
    "Donations/Sponsorship": 'donor',
    "Player Recruitment":    'donor',
    "Coach":                 'coaching',
  }
  return map[value] || ''
}

const mapContactType = (program) => {
  if (!program) return 'player'
  if (program.includes('Player')) return 'player'
  if (program.includes('Fundraising')) return 'donor'
  if (program.includes('Coach')) return 'coach'
  return 'player'
}

const mapLineage = (value) => {
  if (!value) return ''
  const map = {
    "I am an Italian citizen": 'italian-citizen',
    "Parent": 'parent',
    "My grandparent(s) are Italian citizen(s)": 'grandfather',
    "My great-grandparent(s) are Italian citizen(s)": 'great-grandfather',
    "I'm not sure": 'not-sure',
  }
  return map[value] || 'not-sure'
}

const mapPosition = (value) => {
  if (!value) return ''
  const map = {
    'Attack': 'attack',
    'Midfield': 'midfield',
    'Defense': 'defense',
    'Close Defense': 'defense',
    'Goalie': 'goalie',
    'Faceoff': 'faceoff',
    'Face Off': 'faceoff',
    'LSM': 'lsm',
  }
  return map[value] || ''
}

const mapCitizenship = (lineage) => {
  if (lineage === 'italian-citizen') return 'citizen'
  if (lineage === 'parent' || lineage === 'grandfather' || lineage === 'grandmother' ||
      lineage === 'great-grandfather' || lineage === 'great-grandmother') return 'pending'
  return '' // unknown — the beforeChange hook will set not-a-citizen on create
}

const formatDate = (value) => {
  if (!value) return ''

  // Handle MM/DD/YYYY format
  const match = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) {
    const [, month, day, year] = match
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return value
}

// Simple CSV parser (handles quoted fields)
const parseCSV = (text) => {
  const lines = []
  let currentLine = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++ // skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField)
      currentField = ''
    } else if (char === '\n' && !inQuotes) {
      currentLine.push(currentField)
      if (currentLine.some(f => f.trim())) {
        lines.push(currentLine)
      }
      currentLine = []
      currentField = ''
    } else if (char === '\r' && nextChar === '\n' && !inQuotes) {
      // Handle CRLF
      currentLine.push(currentField)
      if (currentLine.some(f => f.trim())) {
        lines.push(currentLine)
      }
      currentLine = []
      currentField = ''
      i++ // skip \n
    } else {
      currentField += char
    }
  }

  // Add last line
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField)
    if (currentLine.some(f => f.trim())) {
      lines.push(currentLine)
    }
  }

  return lines
}

// Escape CSV field
const escapeCSV = (value) => {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// Main transformation
const transformCSV = (inputPath, outputPath) => {
  console.log(`Reading ${inputPath}...`)
  const input = fs.readFileSync(inputPath, 'utf-8')
  const lines = parseCSV(input)

  if (lines.length < 2) {
    console.error('Error: CSV file is empty or has no data rows')
    process.exit(1)
  }

  const headers = lines[0]
  const rows = lines.slice(1)

  console.log(`Found ${rows.length} rows to transform`)

  // Hard-coded column indices matching the Google Form export layout.
  // Duplicate headers (Position, Date of Birth, Town/State of Residence) exist
  // so we must use indices, not findIndex.
  //  0  Timestamp
  //  1  Please select your interest in Italia Lacrosse
  //  2  First Name
  //  3  Last Name
  //  4  Email Address
  //  5  Phone Number
  //  6  Who is your closest Italian born relative?
  //  7  Date of Birth          (adult players)
  //  8  Position               (adult players)
  //  9  High School Attended
  // 10  College Attended
  // 11  Professional Experience
  // 12  Town of Residence      (adult players)
  // 13  State of Residence     (adult players)
  // 14  Country of Residence
  // 15  Link to highlight tape if available
  // 16  Are you over the age of 25?
  // 17  Date of Birth          (youth players)
  // 18  Year of Graduation
  // 19  What team are you interested in?
  // 20  Position               (youth players)
  // 21  Town of Residence      (youth players)
  // 22  State of Residence     (youth players)
  // 23  High School (if U16)
  // 24  Parent/Guardian First Name
  // 25  Parent/Guardian Last Name
  // 26  Parent/Guardian Email
  // 27  Parent/Guardian Phone Number
  // 28  What level are you interested in coaching?
  // 29  Please describe how you would like to be involved…  (donor involvement)
  // 30  Please describe your coaching experience
  // 31  State of Residence     (third duplicate — ignore)

  // Transform rows
  const outputRows = rows.map((row, idx) => {
    const interestRaw = (row[1] || '').trim()
    const isYouth = interestRaw.includes('Youth')
    const isCoach = interestRaw === 'Coach'
    const isDonor = interestRaw === 'Donations/Sponsorship' ||
                    interestRaw === 'Fundraising Commitee' ||
                    interestRaw === 'Fundraising Committee' ||
                    interestRaw === 'Player Recruitment'

    const lineageRaw = (row[6] || '').trim()
    const lineage = mapLineage(lineageRaw)

    // Youth players use columns 17–23; adults use 7–13
    const dob       = isYouth ? row[17] : row[7]
    const position  = isYouth ? row[20] : row[8]
    const town      = isYouth ? row[21] : row[12]
    const state     = isYouth ? row[22] : row[13]
    const highSchool = isYouth ? (row[23] || '') : (row[9] || '')

    return {
      firstName: (row[2] || '').trim(),
      lastName:  (row[3] || '').trim(),
      email:     (row[4] || '').trim(),
      phone:     (row[5] || '').trim(),
      contactType: isCoach ? 'coach' : isDonor ? 'donor' : 'player',
      program:   mapProgram(interestRaw),
      citizenship: mapCitizenship(lineage),
      lineage:   lineage,
      dateOfBirth: formatDate((dob || '').trim()),
      position:  mapPosition((position || '').trim()),
      highSchool: highSchool.trim(),
      college:   (row[10] || '').trim(),
      graduationYear: (row[18] || '').trim(),
      professionalExperience: (row[11] || '').trim(),
      highlightTape: (row[15] || '').trim(),
      'parent-email': (row[26] || '').trim(),
      'parent-phone': (row[27] || '').trim(),
      involvement: isDonor ? (row[29] || '').trim() : '',
      coachingExperience: isCoach ? (row[30] || '').trim() : '',
      'address.street': '',
      'address.city':  (town  || '').trim(),
      'address.state': (state || '').trim(),
      'address.zip':   '',
      'address.country': (row[14] || '').trim() || 'USA',
      notes: '',
    }
  }).filter(row => row.email && row.email.includes('@')) // Skip rows without a valid email

  // parent-email is unique in the schema — only the first sibling keeps it
  const seenParentEmails = new Set()
  outputRows.forEach(row => {
    const pe = row['parent-email']
    if (!pe || pe === 'N/A') { row['parent-email'] = ''; row['parent-phone'] = ''; return }
    if (seenParentEmails.has(pe.toLowerCase())) {
      row['parent-email'] = ''
      row['parent-phone'] = ''
    } else {
      seenParentEmails.add(pe.toLowerCase())
    }
  })

  // Build output CSV
  const outputHeaders = [
    'firstName', 'lastName', 'email', 'phone', 'contactType', 'program',
    'citizenship', 'lineage', 'dateOfBirth', 'position', 'highSchool',
    'college', 'graduationYear', 'professionalExperience', 'highlightTape',
    'parent-email', 'parent-phone', 'involvement', 'coachingExperience',
    'address.street', 'address.city', 'address.state', 'address.zip',
    'address.country', 'notes'
  ]

  const outputLines = [
    outputHeaders.join(','),
    ...outputRows.map(row =>
      outputHeaders.map(h => escapeCSV(row[h])).join(',')
    )
  ]

  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf-8')
  console.log(`✅ Transformed ${outputRows.length} contacts`)
  console.log(`✅ Output written to ${outputPath}`)
  console.log(`\nNext steps:`)
  console.log(`1. Review the output file: ${outputPath}`)
  console.log(`2. Go to http://localhost:3000/admin/collections/contacts`)
  console.log(`3. Click "Import" button`)
  console.log(`4. Upload ${path.basename(outputPath)}`)
}

// CLI
const args = process.argv.slice(2)
if (args.length !== 2) {
  console.error('Usage: node tools/transform-import.js <input.csv> <output.csv>')
  console.error('Example: node tools/transform-import.js ~/Desktop/test-import.csv ./contacts-ready.csv')
  process.exit(1)
}

const [inputPath, outputPath] = args
transformCSV(inputPath, outputPath)
