import { PageHeader, Placeholder } from '@/components/dashboard/page-header'

export default function FormSubmissionsPage() {
  return (
    <>
      <PageHeader
        title="Form Submissions"
        description="Sign-ups and enquiries as they come in."
      />
      <Placeholder note="The form-submissions collection exists, but nothing writes to it yet — the Jotform webhook has not been built." />
    </>
  )
}
