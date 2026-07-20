import config from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/dashboard/page-header'
import { ContactsFilters } from '@/components/dashboard/contacts-filters'
import { ContactsSearch } from '@/components/dashboard/contacts-search'
import { ContactsTable } from '@/components/dashboard/contacts-table'
import { Button } from '@/components/dashboard/ui/button'
import { requireDashboardUser } from '@/lib/auth'

const PAGE_SIZE = 15

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string
    type?: string
    program?: string
    position?: string
    q?: string
  }>
}) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const { page: pageParam, type, program, position, q } = await searchParams
  const requestedPage = Math.max(1, Number(pageParam) || 1)

  const conditions: Where[] = []
  if (type) conditions.push({ contactType: { equals: type } })
  if (program) conditions.push({ program: { equals: program } })
  if (position) conditions.push({ position: { equals: position } })
  if (q) {
    conditions.push({
      or: [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ],
    })
  }

  const result = await payload.find({
    collection: 'contacts',
    user,
    overrideAccess: false,
    page: requestedPage,
    limit: PAGE_SIZE,
    sort: 'lastName',
    where: conditions.length ? { and: conditions } : undefined,
  })

  const filterParams = new URLSearchParams()
  if (type) filterParams.set('type', type)
  if (program) filterParams.set('program', program)
  if (position) filterParams.set('position', position)
  if (q) filterParams.set('q', q)

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Players, donors, and coaches."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ContactsSearch />
        <ContactsFilters />
        <Button asChild size="sm" className="ml-auto">
          <Link href="/dashboard/contacts/new">
            <Plus className="size-4" />
            New Contact
          </Link>
        </Button>
      </div>
      <ContactsTable
        contacts={result.docs}
        page={result.page ?? 1}
        totalPages={result.totalPages}
        totalDocs={result.totalDocs}
        pagingCounter={result.pagingCounter}
        filterQueryString={filterParams.toString()}
      />
    </>
  )
}
