import type { Contact } from '@/payload-types'

// Mirrors the option labels in src/collections/Contacts.ts. Kept as plain
// maps (not imported from the collection config) since that file isn't
// safe to import into client-rendered code.
const PROGRAM_LABELS: Record<string, string> = {
  mens: "Men's",
  womens: "Women's",
  'boys-youth': 'Boys Youth',
  'girls-youth': 'Girls Youth',
  fundraising: 'Fundraising',
  donor: 'Donor',
  coaching: 'Coaching',
}

const POSITION_LABELS: Record<string, string> = {
  attack: 'Attack',
  midfield: 'Midfield',
  lsm: 'LSM',
  defense: 'Defense',
  goalie: 'Goalie',
  faceoff: 'Face Off',
}

export const CITIZENSHIP_LABELS: Record<string, string> = {
  citizen: 'Citizen',
  pending: 'Pending',
  dnq: 'DNQ',
  'not-a-citizen': 'Not a citizen',
}

/**
 * The line under a contact's name in the table. Player and coach both read
 * as "[role detail] - [program]"; donor stays bare since program doesn't
 * carry the same meaning for them (see Contacts.ts: donors' program values
 * are 'donor' | 'fundraising', not a team).
 */
export function getContactSubtitle(contact: Pick<Contact, 'contactType' | 'program' | 'position'>) {
  const programLabel = contact.program ? PROGRAM_LABELS[contact.program] : undefined

  if (contact.contactType === 'donor') {
    return 'Donor'
  }

  if (contact.contactType === 'coach') {
    return programLabel ? `Coach - ${programLabel}` : 'Coach'
  }

  const positionLabel = contact.position ? POSITION_LABELS[contact.position] : undefined
  if (positionLabel && programLabel) return `${positionLabel} - ${programLabel}`
  if (positionLabel) return positionLabel
  if (programLabel) return programLabel
  return 'Player'
}

export function getInitials(firstName?: string | null, lastName?: string | null) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  return initials || '?'
}
