import { getPayload } from 'payload'
import config from '../src/payload.config.js'

const contacts = [
  {
    firstName: 'Cameron',
    lastName: 'Mule',
    email: 'cjm97@duke.edu',
    phone: '(631) 708-7577',
    contactType: 'player',
    program: 'mens',
    citizenship: 'pending',
    lineage: 'great-grandfather',
    dateOfBirth: '1999-04-19',
    position: 'attack',
    highSchool: 'Half Hollow Hills West',
    college: 'Duke',
    address: { city: 'New York', country: 'USA' }
  },
  {
    firstName: 'Joseph',
    lastName: 'Reilly',
    email: 'joseph.reilly13@gmail.com',
    phone: '(516) 398-4952',
    contactType: 'player',
    program: 'mens',
    citizenship: 'pending',
    lineage: 'great-grandfather',
    dateOfBirth: '2005-04-05',
    position: 'defense',
    highSchool: 'The Delbarton School',
    college: 'Committed to Bucknell University',
    address: { city: 'New Jersey', country: 'USA' }
  },
  {
    firstName: 'Michael',
    lastName: 'McBride',
    email: 'mike.m.mcbride@gmail.com',
    phone: '(310) 701-4430',
    contactType: 'player',
    program: 'boys-youth',
    citizenship: 'pending',
    lineage: 'grandfather',
    'parent-email': 'mike.m.mcbride@gmail.com',
    'parent-phone': '(310) 701-4430',
    address: { city: 'Houston', state: 'Texas', country: 'USA' }
  },
  {
    firstName: 'Giuliana',
    lastName: 'Frizzi',
    email: 'giulianafrizzy@gmail.com',
    phone: '(973) 856-9017',
    contactType: 'player',
    program: 'womens',
    citizenship: 'pending',
    lineage: 'great-grandfather',
    dateOfBirth: '1999-05-28',
    position: 'defense',
    highSchool: 'Verona High School',
    college: 'University of Vermont',
    address: { city: 'N/A', country: 'USA' }
  },
  {
    firstName: 'Gianna',
    lastName: 'Kearney',
    email: 'josette.p.kearney@gmail.com',
    phone: '(610) 368-3084',
    contactType: 'player',
    program: 'girls-youth',
    citizenship: 'pending',
    lineage: 'parent',
    dateOfBirth: '2007-03-09',
    'parent-email': 'josette.p.kearney@gmail.com',
    'parent-phone': '(610) 368-3084',
    address: { city: 'Purcellville', state: 'Virginia', country: 'USA' }
  },
  {
    firstName: 'Vito',
    lastName: 'Rotunno',
    email: 'vito.rot@yahoo.com',
    phone: '(78) 808-3128',
    contactType: 'player',
    program: 'mens',
    citizenship: 'citizen',
    lineage: 'italian-citizen',
    dateOfBirth: '1967-10-16',
    position: 'midfield',
    address: { city: 'N/A', country: 'USA' }
  },
  {
    firstName: 'Nicholas',
    lastName: 'Cardile',
    email: 'nicholascardile43@gmail.com',
    phone: '(610) 476-8775',
    contactType: 'player',
    program: 'mens',
    citizenship: 'pending',
    lineage: 'great-grandfather',
    dateOfBirth: '1997-11-14',
    position: 'attack',
    highSchool: 'Avon Grove',
    college: 'Penn State',
    professionalExperience: 'Chrome - PLL',
    address: { city: 'Pennsylvania', country: 'USA' }
  },
  {
    firstName: 'Christian',
    lastName: 'Trasolini',
    email: 'chris.trasolini@gmail.com',
    phone: 'N/A',
    contactType: 'player',
    program: 'mens',
    citizenship: 'pending',
    lineage: 'parent',
    dateOfBirth: '1995-10-03',
    position: 'midfield',
    highSchool: 'New Hyde Park Memorial',
    college: 'Rutgers University',
    professionalExperience: 'Rochester Rattlers',
    address: { city: 'New York', country: 'USA' }
  },
  {
    firstName: 'Damien',
    lastName: 'Ramondo',
    email: 'damram3@hotmail.com',
    phone: '(610) 909-8955',
    contactType: 'donor',
    program: 'fundraising',
    citizenship: 'pending',
    lineage: 'parent',
    address: { country: 'USA' }
  },
  {
    firstName: 'Logan',
    lastName: 'Gutzwiller',
    email: 'Logan@clearmarkcapital.com',
    phone: '(415) 840-6738',
    contactType: 'player',
    program: 'mens',
    citizenship: 'pending',
    lineage: 'grandfather',
    dateOfBirth: '2002-08-19',
    position: 'faceoff',
    highSchool: 'Torrey Pines High School',
    college: 'University of Notre Dame',
    'parent-email': 'Mark@clearmarkcapital.com',
    address: { city: 'San Diego', state: 'California', country: 'USA' }
  }
]

console.log('🚀 Starting import...')

const payload = await getPayload({ config })

let success = 0
let failed = 0

for (const contact of contacts) {
  try {
    console.log(`Creating: ${contact.firstName} ${contact.lastName}`)
    await payload.create({
      collection: 'contacts',
      data: contact
    })
    success++
    console.log(`  ✅ Success`)
  } catch (error) {
    failed++
    console.error(`  ❌ Failed: ${error.message}`)
  }
}

console.log(`\n✨ Complete! ${success} imported, ${failed} failed`)
process.exit(0)
