import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireDashboardUser } from '@/lib/auth'
import { Badge } from '@/components/dashboard/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/dashboard/ui/card'
import { CopyEmailButton } from '@/components/dashboard/copy-email-button'
import { StatusBadge } from '@/components/dashboard/status-badge'
import {
  CITIZENSHIP_LABELS,
  CITIZENSHIP_STYLES,
  CONTACT_TYPE_LABELS,
  LINEAGE_LABELS,
  POSITION_LABELS,
  PROGRAM_LABELS,
  getContactSubtitle,
  getInitials,
} from '@/lib/contact-display'

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value == null || value === '') return null
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-words text-sm">{value}</p>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return undefined
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const contact = await payload.findByID({
    collection: 'contacts',
    id,
    user,
    overrideAccess: false,
    disableErrors: true,
  })

  if (!contact) {
    notFound()
  }

  const isYouth = contact.program === 'boys-youth' || contact.program === 'girls-youth'
  const address = contact.address
  const hasAddress = Boolean(
    address && (address.street || address.city || address.state || address.zip),
  )

  return (
    <>
      <Link
        href="/dashboard/contacts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to contacts
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-base font-medium text-muted-foreground">
            {getInitials(contact.firstName, contact.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{contact.fullName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{getContactSubtitle(contact)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={contact.citizenship ? CITIZENSHIP_STYLES[contact.citizenship] : 'bg-muted text-muted-foreground'}
          >
            {contact.citizenship ? CITIZENSHIP_LABELS[contact.citizenship] : 'Citizenship —'}
          </Badge>
          {contact.status && <StatusBadge status={contact.status} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Email"
              value={
                <span className="inline-flex items-center gap-2">
                  <a href={`mailto:${contact.email}`} className="hover:underline">
                    {contact.email}
                  </a>
                  <CopyEmailButton email={contact.email} />
                </span>
              }
            />
            <Field
              label="Phone"
              value={
                contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="hover:underline">
                    {contact.phone}
                  </a>
                ) : undefined
              }
            />
            <Field label="Contact type" value={CONTACT_TYPE_LABELS[contact.contactType]} />
            <Field label="Program" value={contact.program ? PROGRAM_LABELS[contact.program] : undefined} />
            {contact.contactType === 'player' && (
              <Field label="Date of birth" value={formatDate(contact.dateOfBirth)} />
            )}
            <Field
              label="Lineage"
              value={contact.lineage ? LINEAGE_LABELS[contact.lineage] : undefined}
            />
            {isYouth && (
              <>
                <Field
                  label="Parent email"
                  value={
                    contact['parent-email'] ? (
                      <a href={`mailto:${contact['parent-email']}`} className="hover:underline">
                        {contact['parent-email']}
                      </a>
                    ) : undefined
                  }
                />
                <Field
                  label="Parent phone"
                  value={
                    contact['parent-phone'] ? (
                      <a href={`tel:${contact['parent-phone']}`} className="hover:underline">
                        {contact['parent-phone']}
                      </a>
                    ) : undefined
                  }
                />
              </>
            )}
          </CardContent>
        </Card>

        {contact.contactType === 'player' && (
          <Card>
            <CardHeader>
              <CardTitle>Player Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Position"
                value={contact.position ? POSITION_LABELS[contact.position] : undefined}
              />
              <Field label="High school" value={contact.highSchool} />
              <Field label="College" value={contact.college} />
              <Field label="Graduation year" value={contact.graduationYear} />
              <Field
                label="Highlight tape"
                value={
                  contact.highlightTape ? (
                    <a
                      href={contact.highlightTape}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {contact.highlightTape}
                    </a>
                  ) : undefined
                }
              />
              <div className="sm:col-span-2">
                <Field label="Professional experience" value={contact.professionalExperience} />
              </div>
            </CardContent>
          </Card>
        )}

        {contact.contactType === 'coach' && (
          <Card>
            <CardHeader>
              <CardTitle>Coaching Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="Background" value={contact.coachingExperience} />
              <Field label="College" value={contact.college} />
            </CardContent>
          </Card>
        )}

        {contact.contactType === 'donor' && (
          <Card>
            <CardHeader>
              <CardTitle>Involvement</CardTitle>
            </CardHeader>
            <CardContent>
              <Field label="How they'd like to be involved" value={contact.involvement} />
            </CardContent>
          </Card>
        )}

        {hasAddress && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Street" value={address?.street} />
              </div>
              <Field label="City" value={address?.city} />
              <Field label="State" value={address?.state} />
              <Field label="Zip" value={address?.zip} />
              <Field label="Country" value={address?.country} />
            </CardContent>
          </Card>
        )}

        {contact.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words text-sm">{contact.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Added {formatDate(contact.createdAt)} · Last updated {formatDate(contact.updatedAt)}
      </p>
    </>
  )
}
