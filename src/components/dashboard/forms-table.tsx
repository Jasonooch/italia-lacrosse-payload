'use client'

import { useRouter } from 'next/navigation'
import type { Form } from '@/payload-types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/dashboard/ui/table'

export function FormsTable({ forms }: { forms: (Form & { submissionCount: number })[] }) {
  const router = useRouter()

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Form</TableHead>
            <TableHead className="text-right">Submissions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                No forms yet.
              </TableCell>
            </TableRow>
          ) : (
            forms.map((form) => (
              <TableRow
                key={form.id}
                onClick={() => router.push(`/dashboard/form-submissions/${form.id}`)}
                className="cursor-pointer"
              >
                <TableCell>
                  <p className="font-medium">{form.title}</p>
                  {form.description && (
                    <p className="text-xs text-muted-foreground">{form.description}</p>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">{form.submissionCount}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
