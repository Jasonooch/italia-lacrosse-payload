import { PageHeader, Placeholder } from '@/components/dashboard/page-header'

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" description="Tournaments and internal activities in one view." />
      <Placeholder note="Will merge the existing Events collection with internal meetings/camps/galas. Note: Events is currently admin-only on read, so editors would see nothing here." />
    </>
  )
}
