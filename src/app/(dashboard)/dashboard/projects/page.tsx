import { PageHeader, Placeholder } from '@/components/dashboard/page-header'

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Committee work, broken into sub-tasks with assignees and deadlines."
      />
      <Placeholder note="No Projects collection exists yet. The schema was drafted in discovery but never written to code." />
    </>
  )
}
