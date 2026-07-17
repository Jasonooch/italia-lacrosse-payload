import type { Contact } from '@/payload-types'

// Mirrors the option labels in src/collections/Contacts.ts. Kept as plain
// maps (not imported from the collection config) since that file isn't
// safe to import into client-rendered code.
export const PROGRAM_LABELS: Record<string, string> = {
  mens: "Men's",
  womens: "Women's",
  'boys-youth': 'Boys Youth',
  'girls-youth': 'Girls Youth',
  fundraising: 'Fundraising',
  donor: 'Donor',
  coaching: 'Coaching',
}

export const POSITION_LABELS: Record<string, string> = {
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

export const CITIZENSHIP_STYLES: Record<string, string> = {
  citizen: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  dnq: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  'not-a-citizen': 'bg-muted text-muted-foreground',
}

export const STATUS_LABELS: Record<string, string> = {
  identified: 'Identified',
  pending: 'Pending',
  'players-pool': 'Players Pool',
  dnq: 'DNQ',
}

export const STATUS_STYLES: Record<string, string> = {
  identified: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  'players-pool': 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  dnq: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

export const LINEAGE_LABELS: Record<string, string> = {
  'italian-citizen': 'Is an Italian citizen',
  parent: 'Parent',
  grandparent: 'Grandparent',
  grandfather: 'Grandfather',
  grandmother: 'Grandmother',
  'great-grandparent': 'Great-grandparent',
  'great-grandfather': 'Great-grandfather',
  'great-grandmother': 'Great-grandmother',
  'not-sure': 'Not sure',
}

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  player: 'Player',
  donor: 'Donor',
  coach: 'Coach',
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
