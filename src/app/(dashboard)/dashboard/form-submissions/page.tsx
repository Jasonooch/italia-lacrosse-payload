import config from '@payload-config'
import { getPayload } from 'payload'
import { PageHeader } from '@/components/dashboard/page-header'
import { FormsTable } from '@/components/dashboard/forms-table'
import { requireDashboardUser } from '@/lib/auth'

export default async function FormSubmissionsPage() {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const { docs: forms } = await payload.find({
    collection: 'forms',
    user,
    overrideAccess: false,
    sort: 'title',
    limit: 0,
  })

  const formsWithCounts = await Promise.all(
    forms.map(async (form) => {
      const { totalDocs } = await payload.count({
        collection: 'form-submissions',
        user,
        overrideAccess: false,
        where: { form: { equals: form.id } },
      })
      return { ...form, submissionCount: totalDocs }
    }),
  )

  return (
    <>
      <PageHeader
        title="Form Submissions"
        description="Sign-ups and enquiries as they come in."
      />
      <FormsTable forms={formsWithCounts} />
    </>
  )
}
