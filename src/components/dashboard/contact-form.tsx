'use client'

import { useState, useTransition } from 'react'
import type { Contact } from '@/payload-types'
import {
  CONTACT_TYPE_LABELS,
  LINEAGE_LABELS,
  POSITION_LABELS,
  PROGRAM_LABELS,
  STATUS_LABELS,
} from '@/lib/contact-display'
import { createContact, type ContactFormInput } from '@/app/(dashboard)/dashboard/contacts/actions'
import { Button } from '@/components/dashboard/ui/button'
import { Input } from '@/components/dashboard/ui/input'
import { Textarea } from '@/components/dashboard/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/dashboard/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/dashboard/ui/tabs'

const NONE = '__none'

export interface ContactFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  contactType: Contact['contactType']
  program: string
  status: string
  parentEmail: string
  parentPhone: string
  dateOfBirth: string
  lineage: string
  involvement: string
  coachingExperience: string
  position: string
  highSchool: string
  college: string
  graduationYear: string
  professionalExperience: string
  highlightTape: string
  street: string
  city: string
  state: string
  zip: string
  country: string
}

function dateInputValue(value?: string | null): string {
  if (!value) return ''
  return value.slice(0, 10)
}

export function contactFormStateFrom(contact?: Contact): ContactFormState {
  return {
    firstName: contact?.firstName ?? '',
    lastName: contact?.lastName ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    contactType: contact?.contactType ?? 'player',
    program: contact?.program ?? NONE,
    status: contact?.status ?? NONE,
    parentEmail: contact?.['parent-email'] ?? '',
    parentPhone: contact?.['parent-phone'] ?? '',
    dateOfBirth: dateInputValue(contact?.dateOfBirth),
    lineage: contact?.lineage ?? NONE,
    involvement: contact?.involvement ?? '',
    coachingExperience: contact?.coachingExperience ?? '',
    position: contact?.position ?? NONE,
    highSchool: contact?.highSchool ?? '',
    college: contact?.college ?? '',
    graduationYear: contact?.graduationYear != null ? String(contact.graduationYear) : '',
    professionalExperience: contact?.professionalExperience ?? '',
    highlightTape: contact?.highlightTape ?? '',
    street: contact?.address?.street ?? '',
    city: contact?.address?.city ?? '',
    state: contact?.address?.state ?? '',
    zip: contact?.address?.zip ?? '',
    country: contact?.address?.country ?? 'USA',
  }
}

export function contactFormInputFrom(state: ContactFormState): ContactFormInput {
  return {
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    phone: state.phone || null,
    contactType: state.contactType,
    program: state.program === NONE ? null : (state.program as ContactFormInput['program']),
    status: state.status === NONE ? null : (state.status as ContactFormInput['status']),
    parentEmail: state.parentEmail || null,
    parentPhone: state.parentPhone || null,
    dateOfBirth: state.dateOfBirth || null,
    lineage: state.lineage === NONE ? null : (state.lineage as ContactFormInput['lineage']),
    involvement: state.involvement || null,
    coachingExperience: state.coachingExperience || null,
    position: state.position === NONE ? null : (state.position as ContactFormInput['position']),
    highSchool: state.highSchool || null,
    college: state.college || null,
    graduationYear: state.graduationYear ? Number(state.graduationYear) : null,
    professionalExperience: state.professionalExperience || null,
    highlightTape: state.highlightTape || null,
    address: {
      street: state.street || null,
      city: state.city || null,
      state: state.state || null,
      zip: state.zip || null,
      country: state.country || null,
    },
  }
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

export function ContactFormFields({
  state,
  setState,
}: {
  state: ContactFormState
  setState: React.Dispatch<React.SetStateAction<ContactFormState>>
}) {
  function set<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  const isPlayer = state.contactType === 'player'
  const isDonor = state.contactType === 'donor'
  const isCoach = state.contactType === 'coach'
  const isYouth = state.program === 'boys-youth' || state.program === 'girls-youth'

  return (
    <Tabs defaultValue="basic">
      <TabsList>
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        {isPlayer && <TabsTrigger value="player">Player Details</TabsTrigger>}
        <TabsTrigger value="address">Address</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input value={state.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={state.lastName} onChange={(e) => set('lastName', e.target.value)} />
          </Field>
        </div>

        <Field label="Email">
          <Input type="email" value={state.email} onChange={(e) => set('email', e.target.value)} />
        </Field>

        <Field label="Phone">
          <Input value={state.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact type">
            <Select
              value={state.contactType}
              onValueChange={(value) => set('contactType', value as Contact['contactType'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CONTACT_TYPE_LABELS) as [Contact['contactType'], string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Program">
            <Select value={state.program} onValueChange={(value) => set('program', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No program</SelectItem>
                {Object.entries(PROGRAM_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select value={state.status} onValueChange={(value) => set('status', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Lineage">
            <Select value={state.lineage} onValueChange={(value) => set('lineage', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Not set</SelectItem>
                {Object.entries(LINEAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {isPlayer && (
          <Field label="Date of birth">
            <Input
              type="date"
              value={state.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </Field>
        )}

        {isYouth && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Parent email">
              <Input
                type="email"
                value={state.parentEmail}
                onChange={(e) => set('parentEmail', e.target.value)}
              />
            </Field>
            <Field label="Parent phone">
              <Input value={state.parentPhone} onChange={(e) => set('parentPhone', e.target.value)} />
            </Field>
          </div>
        )}

        {isDonor && (
          <Field label="Involvement">
            <Textarea
              value={state.involvement}
              onChange={(e) => set('involvement', e.target.value)}
              placeholder="How they would like to be involved with Italia Lacrosse"
            />
          </Field>
        )}

        {isCoach && (
          <>
            <Field label="Coaching experience">
              <Textarea
                value={state.coachingExperience}
                onChange={(e) => set('coachingExperience', e.target.value)}
              />
            </Field>
            <Field label="College">
              <Input value={state.college} onChange={(e) => set('college', e.target.value)} />
            </Field>
          </>
        )}
      </TabsContent>

      {isPlayer && (
        <TabsContent value="player" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Position">
              <Select value={state.position} onValueChange={(value) => set('position', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No position</SelectItem>
                  {Object.entries(POSITION_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="High school">
              <Input value={state.highSchool} onChange={(e) => set('highSchool', e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="College">
              <Input value={state.college} onChange={(e) => set('college', e.target.value)} />
            </Field>
            <Field label="Graduation year">
              <Input
                type="number"
                value={state.graduationYear}
                onChange={(e) => set('graduationYear', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Highlight tape">
            <Input
              value={state.highlightTape}
              onChange={(e) => set('highlightTape', e.target.value)}
              placeholder="https://..."
            />
          </Field>

          <Field label="Professional experience">
            <Textarea
              value={state.professionalExperience}
              onChange={(e) => set('professionalExperience', e.target.value)}
            />
          </Field>
        </TabsContent>
      )}

      <TabsContent value="address" className="space-y-4">
        <Field label="Street">
          <Input value={state.street} onChange={(e) => set('street', e.target.value)} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="City">
            <Input value={state.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={state.state} onChange={(e) => set('state', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Zip">
            <Input value={state.zip} onChange={(e) => set('zip', e.target.value)} />
          </Field>
          <Field label="Country">
            <Input value={state.country} onChange={(e) => set('country', e.target.value)} />
          </Field>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export function useContactFormState(contact?: Contact) {
  return useState<ContactFormState>(() => contactFormStateFrom(contact))
}

/** Full-page create form (`/dashboard/contacts/new`). Editing an existing
 * contact uses the same fields inside `EditContactDialog` instead. */
export function ContactForm() {
  const [state, setState] = useContactFormState()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!state.firstName.trim() || !state.lastName.trim() || !state.email.trim()) {
      setError('First name, last name, and email are required.')
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        await createContact(contactFormInputFrom(state))
      } catch (err) {
        // redirect() throws a NEXT_REDIRECT that must be rethrown to navigate.
        if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
          throw err
        }
        setError('Something went wrong creating the contact.')
      }
    })
  }

  return (
    <div className="space-y-5">
      <ContactFormFields state={state} setState={setState} />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isPending}>
          Create Contact
        </Button>
      </div>
    </div>
  )
}
