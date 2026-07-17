import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const JOTFORM_API_KEY = process.env.JOTFORM_API_KEY
const JOTFORM_BASE = 'https://api.jotform.com'
const SUBMISSIONS_PAGE_SIZE = 1000

if (!JOTFORM_API_KEY) {
  console.error('Missing JOTFORM_API_KEY in .env')
  process.exit(1)
}

async function jotformFetch(path, params = {}) {
  const url = new URL(`${JOTFORM_BASE}${path}`)
  url.searchParams.set('apiKey', JOTFORM_API_KEY)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const res = await fetch(url)
  const json = await res.json()

  if (json.responseCode !== 200) {
    throw new Error(json.message || `Jotform API returned ${res.status} for ${path}`)
  }

  return json.content
}

async function fetchAllSubmissions(formId) {
  const submissions = []
  let offset = 0

  while (true) {
    const batch = await jotformFetch(`/form/${formId}/submissions`, {
      limit: SUBMISSIONS_PAGE_SIZE,
      offset,
    })
    submissions.push(...batch)
    if (batch.length < SUBMISSIONS_PAGE_SIZE) break
    offset += SUBMISSIONS_PAGE_SIZE
  }

  return submissions
}

console.log('Fetching forms from Jotform...')
const jotformForms = await jotformFetch('/user/forms')
console.log(`Found ${jotformForms.length} form(s)\n`)

// --dry-run: show what would sync without touching the DB
if (process.argv.includes('--dry-run')) {
  for (const form of jotformForms) {
    console.log(`${form.title} (Jotform #${form.id}) — ${form.count} submission(s)`)
  }
  console.log('\nDry run complete. Remove --dry-run to sync.')
  process.exit(0)
}

const payload = await getPayload({ config })

let formsCreated = 0
let formsUpdated = 0
let submissionsCreated = 0
let submissionsSkipped = 0
const errors = []

for (const jotformForm of jotformForms) {
  const label = `${jotformForm.title} (Jotform #${jotformForm.id})`
  // Jotform's form id is stable and unique, so it doubles as our slug —
  // no need for a separate jotformId field or schema migration.
  const slug = `jotform-${jotformForm.id}`

  try {
    const { docs } = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    let formDoc
    if (docs.length > 0) {
      formDoc = await payload.update({
        collection: 'forms',
        id: docs[0].id,
        data: { title: jotformForm.title, formJSON: jotformForm },
      })
      formsUpdated++
      console.log(`Updated form: ${label}`)
    } else {
      formDoc = await payload.create({
        collection: 'forms',
        data: {
          title: jotformForm.title,
          slug,
          description: `Imported from Jotform (form #${jotformForm.id})`,
          formJSON: jotformForm,
        },
      })
      formsCreated++
      console.log(`Created form: ${label}`)
    }

    const submissions = await fetchAllSubmissions(jotformForm.id)
    console.log(`  ${submissions.length} submission(s) on Jotform`)

    // FormSubmissions has no unique field of its own, so dedupe in memory
    // against the Jotform submission id stashed inside the raw `data` blob.
    const { docs: existingSubmissions } = await payload.find({
      collection: 'form-submissions',
      where: { form: { equals: formDoc.id } },
      limit: 0,
    })
    const existingSubmissionIds = new Set(existingSubmissions.map((s) => s.data?.id).filter(Boolean))

    for (const submission of submissions) {
      if (existingSubmissionIds.has(submission.id)) {
        submissionsSkipped++
        continue
      }
      await payload.create({
        collection: 'form-submissions',
        data: { form: formDoc.id, data: submission },
      })
      submissionsCreated++
    }
  } catch (error) {
    console.error(`  ✗ ${error.message}`)
    errors.push({ label, error: error.message })
  }
}

console.log(`\nForms: ${formsCreated} created, ${formsUpdated} updated`)
console.log(`Submissions: ${submissionsCreated} created, ${submissionsSkipped} already present`)

if (errors.length > 0) {
  console.log('\nFailures:')
  errors.forEach((e) => console.log(`  ${e.label}: ${e.error}`))
}

process.exit(errors.length > 0 ? 1 : 0)
