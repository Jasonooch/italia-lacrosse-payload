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
    "Fundraising Commitee": 'fundraising',
    "Fundraising Committee": 'fundraising',
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
    'Goalie': 'goalie',
    'Faceoff': 'faceoff',
    'Face Off': 'faceoff',
    'LSM': 'lsm',
  }
  return map[value] || value.toLowerCase()
}

const mapCitizenship = (lineage) => {
  if (lineage === 'italian-citizen') return 'citizen'
  if (lineage === 'parent' || lineage === 'grandfather' || lineage === 'grandmother' ||
      lineage === 'great-grandfather' || lineage === 'great-grandmother') return 'pending'
  return 'not-sure'
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

  // Map column indices
  const getCol = (name) => headers.findIndex(h => h.trim() === name)

  const cols = {
    program: getCol('Program'),
    firstName: getCol('First Name'),
    lastName: getCol('Last Name'),
    email: getCol('Email Address'),
    phone: getCol('Phone Number'),
    lineage: getCol('Lineage'),
    dateOfBirth: getCol('Date of Birth'),
    position: getCol('Position'),
    highSchool: getCol('High School'),
    college: getCol('College'),
    professionalExperience: getCol('Professional Experience'),
    city: getCol('City'),
    state: getCol('State'),
    country: getCol('Country'),
    highlightTape: getCol('Highlight Tape'),
    townOfResidence: getCol('Town of Residence'),
    stateOfResidence: getCol('State of Residence'),
    parentFirstName: getCol('Parent/Guardian First Name'),
    parentLastName: getCol('Parent/Guardian Last Name'),
    parentEmail: getCol('Parent Email'),
    parentPhone: getCol('Parent Phone Number'),
    graduationYear: getCol('Year of Graduation'),
  }

  // Transform rows
  const outputRows = rows.map((row, idx) => {
    const program = row[cols.program] || ''
    const lineageRaw = row[cols.lineage] || ''
    const lineage = mapLineage(lineageRaw)

    return {
      firstName: row[cols.firstName] || '',
      lastName: row[cols.lastName] || '',
      email: row[cols.email] || '',
      phone: row[cols.phone] || 'N/A',
      contactType: mapContactType(program),
      program: mapProgram(program),
      citizenship: mapCitizenship(lineage),
      lineage: lineage,
      dateOfBirth: formatDate(row[cols.dateOfBirth]),
      position: mapPosition(row[cols.position]),
      highSchool: row[cols.highSchool] || '',
      college: row[cols.college] || '',
      graduationYear: row[cols.graduationYear] || '',
      professionalExperience: row[cols.professionalExperience] || '',
      highlightTape: row[cols.highlightTape] || '',
      'parent-email': row[cols.parentEmail] || '',
      'parent-phone': row[cols.parentPhone] || '',
      'address.street': '',
      'address.city': row[cols.city] || row[cols.townOfResidence] || '',
      'address.state': row[cols.state] || row[cols.stateOfResidence] || '',
      'address.zip': '',
      'address.country': row[cols.country] || 'USA',
      notes: '',
    }
  }).filter(row => row.email && row.email !== 'N/A') // Skip rows without email

  // Build output CSV
  const outputHeaders = [
    'firstName', 'lastName', 'email', 'phone', 'contactType', 'program',
    'citizenship', 'lineage', 'dateOfBirth', 'position', 'highSchool',
    'college', 'graduationYear', 'professionalExperience', 'highlightTape',
    'parent-email', 'parent-phone', 'address.street', 'address.city',
    'address.state', 'address.zip', 'address.country', 'notes'
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
