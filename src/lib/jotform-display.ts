// Jotform's raw submission shape is field-type-dependent — an answer can be a
// plain string, an array (checkboxes), or a nested object (phone/address/
// fullname/datetime widgets each shape it differently). These are best-effort
// generic readers, not a full Jotform field-type parser.

const SKIPPED_ANSWER_TYPES = new Set([
  'control_head',
  'control_button',
  'control_pagebreak',
  'control_divider',
  'control_collapse',
  'control_paymentmethods',
  'control_paypalcomplete',
])

export interface JotformAnswer {
  name?: string
  order?: string
  text?: string
  type?: string
  answer?: unknown
}

export interface JotformSubmission {
  id: string
  form_id?: string
  created_at?: string
  answers?: Record<string, JotformAnswer>
}

/** Jotform's datetime widgets (birthdays, event dates) store "YYYY-MM-DD
 * HH:mm:ss" — reformat to M-DD-YYYY (single-digit month, no leading zero). */
function formatDateOnly(datetime: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(datetime)
  if (!match) return null
  const [, year, month, day] = match
  return `${Number(month)}-${day}-${year}`
}

export function formatAnswerValue(value: unknown): string | null {
  if (value == null || value === '') return null

  if (typeof value === 'string' || typeof value === 'number') {
    const str = String(value).trim()
    return str || null
  }

  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join(', ')
    return joined || null
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if (typeof obj.datetime === 'string') return formatDateOnly(obj.datetime) ?? obj.datetime
    if (typeof obj.full === 'string') return obj.full
    if (typeof obj.first === 'string' || typeof obj.last === 'string') {
      return [obj.first, obj.last].filter(Boolean).join(' ') || null
    }
    if (typeof obj.addr_line1 === 'string' || typeof obj.city === 'string') {
      const parts = [obj.addr_line1, obj.addr_line2, obj.city, obj.state, obj.postal].filter(
        (part): part is string => typeof part === 'string' && part.length > 0,
      )
      return parts.length ? parts.join(', ') : null
    }
    const parts = Object.values(obj).filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0,
    )
    return parts.length ? parts.join(' ') : null
  }

  return String(value)
}

/** All meaningfully-answered questions on a submission, in form order — skips
 * layout controls (headings, buttons) and payment widgets. */
export function getAnsweredQuestions(submission: JotformSubmission) {
  const answers = Object.values(submission.answers ?? {})
  return answers
    .filter((a) => a.type && !SKIPPED_ANSWER_TYPES.has(a.type))
    .map((a) => ({
      label: a.text || a.name || 'Answer',
      value: formatAnswerValue(a.answer),
      order: Number(a.order) || 0,
    }))
    .filter((a) => a.value !== null)
    .sort((a, b) => a.order - b.order)
}

/** Jotform field types with a fixed, form-authored set of options — worth
 * offering as a select in the filter UI instead of free text. */
export const CHOICE_ANSWER_TYPES = new Set(['control_dropdown', 'control_radio', 'control_checkbox'])

export interface SubmissionColumn {
  /** Stable identity across submissions — Jotform's field `name`, not the
   * (occasionally edited) display label. */
  key: string
  label: string
  order: number
  /** Jotform's control type (e.g. control_dropdown) — used to decide whether
   * this column has a fixed set of choices. Only trustworthy as "the type of
   * whichever submission happened to be scanned first"; Jotform doesn't
   * version field config, so this is best-effort like everything else here. */
  type?: string
}

/** Real questions on a submission regardless of whether it was answered —
 * used to derive the grid's column set, unlike getAnsweredQuestions which
 * only returns what this one submission actually filled in. */
function getSubmissionQuestions(submission: JotformSubmission): SubmissionColumn[] {
  const answers = Object.values(submission.answers ?? {})
  return answers
    .filter((a) => a.type && !SKIPPED_ANSWER_TYPES.has(a.type))
    .map((a) => ({
      key: a.name || a.text || 'answer',
      label: a.text || a.name || 'Answer',
      order: Number(a.order) || 0,
      type: a.type,
    }))
}

/** The union of every question asked across a form's submissions, in form
 * order — some submissions may skip conditional fields, so no single
 * submission is guaranteed to have the full column set. */
export function getSubmissionColumns(submissions: JotformSubmission[]): SubmissionColumn[] {
  const columns = new Map<string, SubmissionColumn>()
  for (const submission of submissions) {
    for (const question of getSubmissionQuestions(submission)) {
      if (!columns.has(question.key)) columns.set(question.key, question)
    }
  }
  return Array.from(columns.values()).sort((a, b) => a.order - b.order)
}

export function getAnswerForColumn(submission: JotformSubmission, columnKey: string): string | null {
  const answers = Object.values(submission.answers ?? {})
  const match = answers.find((a) => (a.name || a.text || 'answer') === columnKey)
  return match ? formatAnswerValue(match.answer) : null
}

/** Best-effort name/email for the table row — every form has different field
 * names, so this tries a few common patterns rather than assuming one. */
export function getSubmissionSummary(submission: JotformSubmission) {
  const answers = Object.values(submission.answers ?? {})

  const emailAnswer = answers.find((a) => a.type === 'control_email' && typeof a.answer === 'string')
  const email = emailAnswer ? (emailAnswer.answer as string) : null

  const fullnameAnswer = answers.find((a) => a.type === 'control_fullname' && a.answer)
  let name: string | null = fullnameAnswer ? formatAnswerValue(fullnameAnswer.answer) : null

  if (!name) {
    const matchesFirst = (a: JotformAnswer) => /first.?name/i.test(a.name || '') || /first.?name/i.test(a.text || '')
    const matchesLast = (a: JotformAnswer) => /last.?name/i.test(a.name || '') || /last.?name/i.test(a.text || '')
    const first = answers.find((a) => matchesFirst(a) && a.answer)
    const last = answers.find((a) => matchesLast(a) && a.answer)
    if (first || last) {
      name = [first?.answer, last?.answer].filter(Boolean).join(' ')
    } else {
      const nameField = answers.find((a) => /name/i.test(a.text || '') && typeof a.answer === 'string')
      if (nameField) name = nameField.answer as string
    }
  }

  return { name, email }
}

/** Jotform timestamps are "YYYY-MM-DD HH:mm:ss" with no timezone offset. */
export function formatSubmissionDate(submission: JotformSubmission) {
  if (!submission.created_at) return null
  const date = new Date(submission.created_at.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return submission.created_at
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
