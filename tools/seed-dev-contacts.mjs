import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.js'

// Local-dev only: refuses to run against production, mirroring the guard
// pattern used by import-contacts.mjs's :prod variant. payload.config.ts
// flips to remote D1/R2 bindings whenever NODE_ENV=production, so this is
// the one env var that actually matters here.
if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed dev contacts with NODE_ENV=production. This is for local D1 only.')
  process.exit(1)
}

// Every seeded row lives under this domain so re-runs can find and replace
// just their own rows without touching real imported contacts.
const SEED_DOMAIN = 'dev-seed.test'

const FIRST_NAMES = [
  'Marco', 'Giulia', 'Luca', 'Sofia', 'Alessandro', 'Francesca', 'Matteo', 'Elena',
  'Davide', 'Chiara', 'Antonio', 'Valentina', 'James', 'Emily', 'Michael', 'Olivia',
  'Daniel', 'Ava', 'Christopher', 'Isabella', 'Andrea', 'Martina', 'Nicolo', 'Giorgia',
]
const LAST_NAMES = [
  'Rossi', 'Bianchi', 'Ferrari', 'Russo', 'Romano', 'Colombo', 'Ricci', 'Marino',
  'Greco', 'Bruno', 'Gallo', 'Conti', 'Chen', 'Wilson', 'Lombardi', 'Moretti',
  'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli',
]
const PLAYER_PROGRAMS = ['mens', 'womens', 'boys-youth', 'girls-youth']
const COACH_PROGRAMS = ['mens', 'womens', 'boys-youth', 'girls-youth']
const DONOR_PROGRAMS = ['donor', 'fundraising', undefined]
const POSITIONS = ['attack', 'midfield', 'lsm', 'defense', 'goalie', 'faceoff']
const CITIZENSHIPS = ['citizen', 'citizen', 'citizen', 'not-a-citizen', 'not-a-citizen', 'pending', 'dnq']

function pick(arr, index) {
  return arr[index % arr.length]
}

function buildContact(index) {
  const firstName = pick(FIRST_NAMES, index)
  const lastName = pick(LAST_NAMES, index + Math.floor(index / FIRST_NAMES.length))
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${index}@${SEED_DOMAIN}`

  // Roughly 60% player, 25% donor, 15% coach — matches a real roster's shape
  // more than an even split would.
  const roll = index % 20
  const contactType = roll < 12 ? 'player' : roll < 17 ? 'donor' : 'coach'

  const base = {
    firstName,
    lastName,
    email,
    phone: `(${200 + (index % 700)}) 555-${String(1000 + index).slice(-4)}`,
    contactType,
    citizenship: pick(CITIZENSHIPS, index),
  }

  if (contactType === 'player') {
    return {
      ...base,
      program: pick(PLAYER_PROGRAMS, index),
      // ~1 in 6 players has no position set yet, to exercise the fallback
      // in the Contacts table subtitle.
      position: index % 6 === 0 ? undefined : pick(POSITIONS, index),
    }
  }

  if (contactType === 'coach') {
    return {
      ...base,
      program: pick(COACH_PROGRAMS, index),
      coachingExperience: 'Seeded dev record — coaching background placeholder.',
    }
  }

  return {
    ...base,
    program: pick(DONOR_PROGRAMS, index),
    involvement: 'Seeded dev record — involvement placeholder.',
  }
}

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'contacts',
    where: { email: { contains: `@${SEED_DOMAIN}` } },
    limit: 500,
    depth: 0,
  })

  if (existing.totalDocs > 0) {
    console.log(`Removing ${existing.totalDocs} previously seeded contact(s)...`)
    for (const doc of existing.docs) {
      await payload.delete({ collection: 'contacts', id: doc.id })
    }
  }

  const COUNT = 48
  console.log(`Seeding ${COUNT} dev contacts...`)

  for (let i = 0; i < COUNT; i++) {
    const data = buildContact(i)
    await payload.create({ collection: 'contacts', data })
  }

  console.log(`Done. ${COUNT} contacts seeded under @${SEED_DOMAIN}.`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
