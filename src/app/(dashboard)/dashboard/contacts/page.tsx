import config from '@payload-config'
import { getPayload } from 'payload'
import { PageHeader } from '@/components/dashboard/page-header'
import { ContactsTable } from '@/components/dashboard/contacts-table'
import { requireDashboardUser } from '@/lib/auth'

const PAGE_SIZE = 15

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const user = await requireDashboardUser()
  const payload = await getPayload({ config })

  const { page: pageParam } = await searchParams
  const requestedPage = Math.max(1, Number(pageParam) || 1)

  const result = await payload.find({
    collection: 'contacts',
    user,
    overrideAccess: false,
    page: requestedPage,
    limit: PAGE_SIZE,
    sort: 'lastName',
  })

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Players, donors, and coaches — the people behind the program."
      />
      <ContactsTable
        contacts={result.docs}
        page={result.page ?? 1}
        totalPages={result.totalPages}
        totalDocs={result.totalDocs}
        pagingCounter={result.pagingCounter}
      />
    </>
  )
}
