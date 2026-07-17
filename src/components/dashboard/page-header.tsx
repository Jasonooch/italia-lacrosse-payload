export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function Placeholder({ note }: { note: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed">
      <p className="max-w-md px-6 text-center text-sm text-muted-foreground">{note}</p>
    </div>
  )
}
