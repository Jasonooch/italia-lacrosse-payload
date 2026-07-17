'use client'

import { useState } from 'react'
import type { FormSubmission } from '@/payload-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/dashboard/ui/table'
import { SubmissionQuickView } from '@/components/dashboard/submission-quick-view'
import {
  formatSubmissionDate,
  getAnswerForColumn,
  type JotformSubmission,
  type SubmissionColumn,
} from '@/lib/jotform-display'

export function SubmissionsTable({
  submissions,
  columns,
}: {
  submissions: FormSubmission[]
  columns: SubmissionColumn[]
}) {
  const [quickViewSubmission, setQuickViewSubmission] = useState<FormSubmission | null>(null)

  return (
    <div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Submitted</TableHead>
              {columns.map((column) => (
                <TableHead key={column.key} title={column.label} className="max-w-60 truncate">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => {
                const data = submission.data as unknown as JotformSubmission
                return (
                  <TableRow
                    key={submission.id}
                    onClick={() => setQuickViewSubmission(submission)}
                    className="cursor-pointer"
                  >
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatSubmissionDate(data) || '—'}
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key} className="max-w-60 truncate whitespace-nowrap">
                        {getAnswerForColumn(data, column.key) || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <SubmissionQuickView
        submission={quickViewSubmission}
        open={quickViewSubmission !== null}
        onOpenChange={(open) => {
          if (!open) setQuickViewSubmission(null)
        }}
      />

      <p className="mt-4 text-sm text-muted-foreground">
        {submissions.length} submission{submissions.length === 1 ? '' : 's'}
      </p>
    </div>
  )
}
