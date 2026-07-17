'use client'

import type { FormSubmission } from '@/payload-types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/dashboard/ui/sheet'
import {
  formatSubmissionDate,
  getAnsweredQuestions,
  getSubmissionSummary,
  type JotformSubmission,
} from '@/lib/jotform-display'

export function SubmissionQuickView({
  submission,
  open,
  onOpenChange,
}: {
  submission: FormSubmission | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const data = submission?.data as unknown as JotformSubmission | undefined
  const summary = data ? getSubmissionSummary(data) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        {data && summary && (
          <>
            <SheetHeader>
              <SheetTitle>{summary.name || `Submission #${data.id}`}</SheetTitle>
              <SheetDescription>
                {[summary.email, formatSubmissionDate(data)].filter(Boolean).join(' · ')}
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 px-4">
              {getAnsweredQuestions(data).map((question, i) => (
                <div key={i} className="min-w-0">
                  <p className="text-xs text-muted-foreground">{question.label}</p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{question.value}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
