import config from '@payload-config'
import { getPayload } from 'payload'
import type { Where } from 'payload'
import { PageHeader } from '@/components/dashboard/page-header'
import { ContactsFilters } from '@/components/dashboard/contacts-filters'
import { ContactsTable } from '@/components/dashboard/contacts-table'
import { requireDashboardUser } from '@/lib/auth'

const PAGE_SIZE = 15

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; program?: string; position?: string }>
}) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const { page: pageParam, type, program, position } = await searchParams
  const requestedPage = Math.max(1, Number(pageParam) || 1)

  const conditions: Where[] = []
  if (type) conditions.push({ contactType: { equals: type } })
  if (program) conditions.push({ program: { equals: program } })
  if (position) conditions.push({ position: { equals: position } })

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

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Players, donors, and coaches — the people behind the program."
      />
      <ContactsFilters />
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
