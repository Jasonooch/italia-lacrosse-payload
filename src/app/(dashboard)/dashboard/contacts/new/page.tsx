import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireDashboardUser } from '@/lib/auth'
import { PageHeader } from '@/components/dashboard/page-header'
import { ContactForm } from '@/components/dashboard/contact-form'

export default async function NewContactPage() {
  await requireDashboardUser()

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/contacts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to contacts
      </Link>
      <PageHeader title="New Contact" description="Add a player, donor, or coach." />
      <ContactForm />
    </div>
  )
}
