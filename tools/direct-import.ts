import { getPayload } from 'payload'
import config from '../src/payload.config'
import fs from 'fs'
import path from 'path'

/**
 * Direct import of contacts CSV using Payload Local API
 * Usage: tsx tools/direct-import.ts <csv-file>
 */

// Simple CSV parser
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

const importContacts = async (csvPath: string) => {
  console.log('🚀 Starting direct import...')
  console.log(`📁 Reading: ${csvPath}`)

  // Read CSV
  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = parseCSV(csvContent)

  if (lines.length < 2) {
    console.error('❌ CSV file is empty or has no data rows')
    process.exit(1)
  }

  const headers = lines[0]
  const rows = lines.slice(1)

  console.log(`📊 Found ${rows.length} contacts to import`)

  // Initialize Payload
  console.log('⚙️  Initializing Payload...')
  const payload = await getPayload({ config })

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ row: number; email: string; error: string }> = []

  // Import each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 because row 1 is headers

    try {
      // Map row to object
      const data: any = {}
      headers.forEach((header, idx) => {
        const value = row[idx]?.trim()
        if (value && value !== '') {
          // Handle nested fields (address.city, etc.)
          if (header.includes('.')) {
            const [parent, child] = header.split('.')
            if (!data[parent]) data[parent] = {}
            data[parent][child] = value
          } else {
            data[header] = value
          }
        }
      })

      // Convert graduationYear to number if present
      if (data.graduationYear) {
        data.graduationYear = parseInt(data.graduationYear, 10)
      }

      console.log(`  [${rowNum}/${rows.length + 1}] Creating: ${data.firstName} ${data.lastName} (${data.email})`)

      // Create contact using Local API
      await payload.create({
        collection: 'contacts',
        data,
      })

      successCount++
      console.log(`    ✅ Success`)
    } catch (error: any) {
      errorCount++
      const email = row[headers.indexOf('email')] || 'unknown'
      const errorMsg = error.message || String(error)
      console.error(`    ❌ Failed: ${errorMsg}`)
      errors.push({ row: rowNum, email, error: errorMsg })
    }
  }

  console.log('\n📈 Import Summary:')
  console.log(`  ✅ Successful: ${successCount}`)
  console.log(`  ❌ Failed: ${errorCount}`)

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    errors.forEach(({ row, email, error }) => {
      console.log(`  Row ${row} (${email}): ${error}`)
    })
  }

  console.log('\n✨ Import complete!')
  process.exit(0)
}

// CLI
const args = process.argv.slice(2)
if (args.length !== 1) {
  console.error('Usage: tsx tools/direct-import.ts <csv-file>')
  console.error('Example: tsx tools/direct-import.ts tools/contacts-ready-to-import.csv')
  process.exit(1)
}

const csvPath = path.resolve(args[0])
if (!fs.existsSync(csvPath)) {
  console.error(`Error: File not found: ${csvPath}`)
  process.exit(1)
}

importContacts(csvPath).catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
