import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { SubmissionsTable } from '@/components/dashboard/submissions-table'
import { requireDashboardUser } from '@/lib/auth'
import { getSubmissionColumns, type JotformSubmission } from '@/lib/jotform-display'

export default async function FormDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const form = await payload.findByID({
    collection: 'forms',
    id,
    user,
    overrideAccess: false,
    disableErrors: true,
  })

  if (!form) {
    notFound()
  }

  const { docs: submissions } = await payload.find({
    collection: 'form-submissions',
    user,
    overrideAccess: false,
    where: { form: { equals: form.id } },
    sort: '-createdAt',
    limit: 0,
  })

  const columns = getSubmissionColumns(
    submissions.map((submission) => submission.data as unknown as JotformSubmission),
  )

  return (
    <>
      <Link
        href="/dashboard/form-submissions"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to forms
      </Link>

      <PageHeader title={form.title} description={form.description || 'Submissions for this form.'} />

      <SubmissionsTable submissions={submissions} columns={columns} formTitle={form.title} />
    </>
  )
}
