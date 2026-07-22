/** Return shape for dashboard server actions that mutate data without
 * redirecting. Guards (validation, permissions, missing docs) and caught
 * failures return `ok: false` with a user-facing `error`, so client
 * components can keep the user's draft and surface the message instead of
 * silently pretending the write succeeded. (A single interface rather than a
 * discriminated union because this project compiles without
 * `strictNullChecks`, where union narrowing on `ok` doesn't apply.) */
export interface ActionResult {
  ok: boolean
  error?: string
}

export const ACTION_FAILED: ActionResult = {
  ok: false,
  error: 'Something went wrong. Please try again.',
}
