import type { WidgetServerProps } from 'payload'

export default async function TotalContactsWidget({ req }: WidgetServerProps) {
  const { payload } = req

  // Server-side data fetch (fast & secure)
  const { totalDocs } = await payload.count({
    collection: 'contacts', // your collection slug
    // optional: add where: { contactType: { equals: 'player' } } for filtered counts
  })

  return (
    <div className="card">
      {' '}
      {/* Payload's built-in card styling */}
      <h3>Total Contacts</h3>
      <p>
        {totalDocs.toLocaleString()} {/* nice comma formatting */}
      </p>
    </div>
  )
}
