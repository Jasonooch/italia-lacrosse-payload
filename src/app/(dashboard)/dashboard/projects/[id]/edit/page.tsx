import config from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { requireDashboardUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/page-header'
import { ProjectForm } from '@/components/dashboard/project-form'
import { DeleteProjectButton } from '@/components/dashboard/delete-project-button'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const project = await payload.findByID({
    collection: 'projects',
    id,
    user,
    overrideAccess: false,
    disableErrors: true,
    depth: 1,
  })

  if (!project) {
    notFound()
  }

  const [{ docs: users }, { docs: tournaments }] = await Promise.all([
    payload.find({ collection: 'users', user, overrideAccess: false, sort: 'firstName', limit: 0 }),
    payload.find({ collection: 'tournaments', user, overrideAccess: false, sort: '-year', limit: 0 }),
  ])

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/dashboard/projects/${project.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to project
      </Link>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Edit Project" description="Update project details, owner, team, and dates." />
        <DeleteProjectButton projectId={project.id} projectTitle={project.title} />
      </div>
      <ProjectForm project={project} users={users} tournaments={tournaments} />
    </div>
  )
}
