import type { User } from '@/payload-types'
import { mentionLabel } from '@/components/dashboard/mention-input'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const URL_PATTERN = /https?:\/\/[^\s<>"]+[^\s<>".,;:!?)]/g

type MatchRange = { start: number; end: number; render: (key: number) => React.ReactNode }

/** Renders comment/note text with `@Name` mentions (matched against the given
 * staff list) highlighted and raw `http(s)://` URLs turned into clickable
 * links. Display-only — mention matching is by name substring, not stored
 * offsets, so it re-derives highlights from the plain text on every render. */
export function MentionText({ text, staff }: { text: string; staff: User[] }) {
  const names = staff
    .map(mentionLabel)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)

  const matches: MatchRange[] = []

  if (names.length > 0) {
    const mentionPattern = new RegExp(`@(?:${names.map(escapeRegExp).join('|')})`, 'g')
    let match: RegExpExecArray | null
    while ((match = mentionPattern.exec(text)) !== null) {
      const value = match[0]
      matches.push({
        start: match.index,
        end: match.index + value.length,
        render: (key) => (
          <span key={key} className="rounded bg-primary/10 px-0.5 font-medium text-primary">
            {value}
          </span>
        ),
      })
    }
  }

  let urlMatch: RegExpExecArray | null
  URL_PATTERN.lastIndex = 0
  while ((urlMatch = URL_PATTERN.exec(text)) !== null) {
    const value = urlMatch[0]
    matches.push({
      start: urlMatch.index,
      end: urlMatch.index + value.length,
      render: (key) => (
        <a
          key={key}
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {value}
        </a>
      ),
    })
  }

  if (matches.length === 0) return <>{text}</>
  matches.sort((a, b) => a.start - b.start)

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0
  for (const range of matches) {
    if (range.start < lastIndex) continue
    if (range.start > lastIndex) parts.push(text.slice(lastIndex, range.start))
    parts.push(range.render(key++))
    lastIndex = range.end
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return <>{parts}</>
}
