# Admin Dashboard — Discovery Context

**Captured:** 2026-07-16
**Status:** Foundation through status-color-coding is committed and deployed
(through commit `1f05e79`). Filters/status-color/Jotform work from the 2026-07-17
session **is built and verified but NOT committed or deployed** — see the
⚠️ callout in Build Progress for the exact file list and next steps.
See "Build Progress" below for what exists now — the discovery context below it is
still accurate background, just no longer "nothing built yet."
**Purpose:** Hand-off doc. Everything below came out of a discovery conversation and is
not derivable from the codebase. Read this before planning the dashboard.

## Build Progress (updated 2026-07-16 evening)

**Live at `/dashboard`.** Auth-gated on the same Payload session (`Boolean(user)`,
matching the admin's own rule — no role check, since `Users.roles` is admin-only on
read and everyone manages contacts/rosters per the discovery notes below).

**Done:**
- Route group `src/app/(dashboard)/` — Tailwind v4 + shadcn scoped to this tree only
  (`source(none)` + explicit `@source` paths in `globals.css`), so the Payload admin
  and public `(frontend)` are untouched. Verified visually — admin UI unaffected.
- Sidebar shell, all 5 nav sections routed (Overview real, others honest placeholders
  naming what's missing rather than faking functionality).
- Styled to match Jason's Paper mockup: active nav pill `#F5F6F8` bg / `#0057B8` text,
  semibold (not bold) on the active item, "Admin Panel" subtitle, no hover color change.
- **Contacts table** — real Payload data via Local API (`overrideAccess: false`).
  Row = avatar initials + name + role-specific subtitle (`"Attack - Men's"` for
  players/coaches with program, bare `"Donor"` for donors — program doesn't mean the
  same thing for them). Citizenship badge. Copy-email action with a legacy
  `execCommand` fallback (a real bug was caught and fixed here: the original
  Clipboard-API-only version silently failed with an unhandled rejection when
  permission was denied). Windowed pagination (`1 … 4 5 6 … 42`), not every page
  number — matters once this points at 1,800 real contacts.
- Light/dark/system theme toggle (`next-themes`), verified deterministically via DOM
  (`class="light"`/`"dark"`), not just screenshots — the browser automation tool in
  this session proved unreliable for pixel-coordinate clicks.
- `pnpm seed:dev-contacts` — local-only synthetic contact seeder (48 records, refuses
  to run with `NODE_ENV=production`) so the table could be built/verified without
  touching the real ~1,800 contacts. Re-runnable; only touches its own
  `@dev-seed.test` rows.

**Also done (2026-07-17):**
- **Contact detail page** at `/dashboard/contacts/[id]`. The "view" icon in the
  Contacts table now links here (`overflow "more actions" icon still inert — no
  menu exists yet). Sections are conditional on `contactType`: Basic Info always,
  Player Details / Coaching Experience / Involvement mutually exclusive by type,
  Address only if any address field is set, Notes only if present. Parent
  email/phone shown only for `boys-youth`/`girls-youth` programs, matching the
  same condition used in `Contacts.ts`. Uses `disableErrors: true` on
  `findByID` + `notFound()` rather than try/catch. Added a shadcn `Card`
  component (`src/components/dashboard/ui/card.tsx`) — first use of Card in
  this tree; prior pages (Overview, Contacts table) hand-rolled `rounded-lg
  border` divs instead. Verified all three contact types (player/coach/donor)
  plus the 404 case against the seeded dev data.
  - Fixed a real responsive bug found during review: `CardContent` grids used
    bare `grid gap-4 sm:grid-cols-2` with no base column class. Below `sm`,
    that leaves no explicit `grid-template-columns`, so Chromium sizes the
    implicit track to `max-content` — which doesn't shrink for a long
    unbroken string (a URL, a run-on note) even with `break-words` applied.
    Fix: always declare an explicit `grid-cols-1` base (Tailwind's `grid-cols-N`
    utilities use `minmax(0,1fr)` tracks, which do shrink), plus `min-w-0` on
    `Card`/`CardContent` themselves (flex/grid items whose default
    `min-width: auto` would otherwise still force overflow) and `break-words`
    on the actual text nodes. Reproduced by temporarily writing long unbroken
    values into a dev-seed contact via direct sqlite3 UPDATE, then reverted.
- **Contact quick-view drawer**: clicking a row (or the eye icon) in
  `ContactsTable` opens a right-side `Sheet` (`contact-quick-view.tsx`) with
  name/avatar/subtitle, citizenship+status badges, email (with copy button),
  phone, contact type, program, and notes — using the `Contact` object
  already in memory from the table's list query, no extra fetch. A
  "View Full Details" button links to the full `/dashboard/contacts/[id]`
  page. `ContactsTable` is now a client component (`'use client'`) to hold
  the open/selected state; row clicks are stopped from bubbling on the
  checkbox and actions cells so selecting/copying doesn't also open the
  drawer. Extracted `CITIZENSHIP_STYLES` and a shared `CitizenshipBadge`
  component (`citizenship-badge.tsx`) since the styling map was about to be
  duplicated a third time across table/detail-page/drawer.
- **Routing resolved**: `italialacrosse.us` (root) is the public site, hosted on
  Divhunt — a separate platform, not this repo. This app deploys at
  `admin.italialacrosse.us` only. Jason is the only one who needs Payload's raw
  admin UI; every other staff member should land on `/dashboard`. Changed `/`
  (`src/app/(frontend)/page.tsx`) to redirect to `/dashboard` instead of `/admin`.
  The existing "Payload admin" item in the sidebar user-menu dropdown
  (`nav-user.tsx`) now opens `/admin` with `target="_blank"` so Jason can reach
  the CMS without leaving the dashboard tab.

**Also done (2026-07-17, continued — filters, status color, Jotform):**
- **Contacts filters**: Type/Program/Position dropdowns above the Contacts table,
  styled to match the reference CRM template's `opportunities-section.tsx` exactly —
  `DropdownMenu` + `DropdownMenuRadioGroup`/`RadioItem` behind an outline button
  (filter icon + label + chevron), not a native `<select>`. Filters are URL search
  params (`?type=&program=&position=`), applied server-side via a Payload `where`
  clause, threaded through pagination links so paging doesn't drop them. Added
  `citizenship-badge.tsx` extraction while here (styling map was about to be
  duplicated a third time).
- **Contacts table restructured**: Program and Position are now real columns; the
  subtitle under each name is now just contact Type (Player/Donor/Coach) instead of
  the old combined position/program string.
- **Status color-coded** to match Citizenship's palette: green (Players Pool), amber
  (Pending), red (DNQ), blue (Identified — no citizenship equivalent). New shared
  `StatusBadge` component, used in the contact detail page and quick-view drawer.
- **Found and fixed a real production bug**: `CITIZENSHIP_STYLES` (and later
  `STATUS_STYLES`) live in `src/lib/contact-display.ts`, which was outside
  `globals.css`'s Tailwind `@source` scan (`./` and `../../components/dashboard`
  only). The green/amber/red utility classes referenced only there were never
  generated — badges rendered with the right class names but no actual color, live
  in production. Fixed by adding `@source '../../lib'`. **This had already been
  deployed** before being caught — worth remembering that `src/lib` utilities using
  Tailwind classes are easy to silently break this way; check `globals.css`'s
  `@source` list before adding new ones.
- **Jotform integration (new, from scratch)**:
  - `JOTFORM_API_KEY` added to `.env` (gitignored) and `.env.example` (empty
    placeholder). Locked down `Forms`/`FormSubmissions` access to `authenticated`
    staff — both had **no `access` key at all before**, meaning Payload's default
    (open to anyone) applied; real signup PII would have been publicly readable via
    the API once submissions existed.
  - `tools/sync-jotform.mjs` (`pnpm sync:jotform`, `--dry-run` to preview, `:prod`
    variant exists) — pulls all forms + submissions via Jotform's REST API,
    upserts `forms` by `slug: jotform-<jotformId>` (no schema migration needed —
    Jotform's own form ID doubles as the unique key) and dedupes `form-submissions`
    in-memory against the Jotform submission ID stashed in the raw `data` blob (no
    unique field exists on that collection either).
  - **Ran against local dev**: 18 real forms, 1,183 real submissions pulled in.
    This is real Jotform account data sitting in the local D1 SQLite file — not
    synthetic like the contact seeder. Re-running the sync is safe (upsert, not
    insert) but nothing purges deleted-on-Jotform submissions.
  - `/dashboard/form-submissions` — table of forms with submission counts, click a
    row → `/dashboard/form-submissions/[id]` — a genuine spreadsheet grid (styled to
    match Jotform's own submissions table look, per Jason's reference screenshot):
    one row per submission, one column per distinct question asked across that
    form's submissions (columns derived dynamically, not hardcoded — every form has
    different fields), horizontally scrollable, long headers truncate with an
    ellipsis (native `title` tooltip shows the full question on hover). Row click
    still opens a `SubmissionQuickView` drawer with the full Q&A for that submission
    (useful for truncated/long free-text answers).
  - `src/lib/jotform-display.ts` — all the "make Jotform's messy per-field-type raw
    JSON presentable" logic: `formatAnswerValue` (generic reader for
    string/array/phone/address/fullname/datetime answer shapes),
    `getSubmissionColumns` (union of every question ever asked on a form, ordered),
    `getSubmissionSummary` (best-effort name/email extraction for the drawer title —
    every form names its fields differently, so this tries a few patterns rather
    than assuming one), `formatSubmissionDate`. Datetime answers (birthdays, event
    dates) are formatted `M-DD-YYYY` (single-digit month, no leading zero) per
    Jason's request. Payment-widget answer types (`control_paypalcomplete`,
    `control_paymentmethods`) and layout controls (`control_head`, `control_button`,
    etc.) are filtered out everywhere — not shown in the grid or the drawer.
  - **Found and fixed a second overflow bug** while building the wide grid: the
    dashboard's shared layout — `SidebarInset` (`src/components/dashboard/ui/sidebar.tsx`)
    and the content wrapper div in `src/app/(dashboard)/dashboard/layout.tsx` — was
    missing `min-w-0`. A genuinely wide table (needs to scroll internally by design)
    was pushing the *whole page* wider than the viewport, not just its own
    `overflow-x-auto` container. Same root cause as the earlier Contacts grid
    overflow bug, just in a flex layout instead of CSS grid this time. Fixed at the
    shared-component level so it protects every future page, not just this one.

**⚠️ UNCOMMITTED as of end of session (2026-07-17):** none of the filters/status-color/
Jotform work above has been committed or deployed. Modified:
`.env.example`, `package.json`, `src/app/(dashboard)/dashboard/form-submissions/page.tsx`,
`src/app/(dashboard)/dashboard/layout.tsx`, `src/collections/FormSubmissions.ts`,
`src/collections/Forms.ts`, `src/components/dashboard/ui/sidebar.tsx`. New:
`src/app/(dashboard)/dashboard/form-submissions/[id]/`, `src/components/dashboard/forms-table.tsx`,
`src/components/dashboard/submission-quick-view.tsx`, `src/components/dashboard/submissions-table.tsx`,
`src/lib/jotform-display.ts`, `tools/sync-jotform.mjs`. (Also `.env` itself has
`JOTFORM_API_KEY` set, but that file is gitignored and never committed.) Typecheck
and lint are clean; verified in the browser against the real synced data. **Next
session: commit (probably 2-3 logical commits, same pattern as before), push, then
`pnpm run deploy`** — the citizenship/status color fix in particular is a real
production bug fix that should ship soon.

**Not done / open threads:**
- **Jotform sync is manual, not automatic.** Jason explicitly asked for "just pull
  in submissions right now to test everything out" rather than the webhook approach
  originally recommended (see Decisions table) — new submissions won't appear until
  someone runs `pnpm sync:jotform` again. A "Sync now" button in the dashboard UI,
  or the originally-recommended webhook, are the natural next steps but weren't
  asked for yet.
- **Form submissions aren't linked to Contacts.** `Contacts.sourceFormSubmission`
  already exists in the schema for this, but the Jotform sync script doesn't
  create/match Contacts from submission data — that's a separate, unbuilt piece.
  Also `Forms.formJSON` currently stores Jotform's `/user/forms` list-endpoint
  response (title/id/count/url metadata), **not** the actual field/question
  definitions (that's a different endpoint, `/form/{id}/questions`, never called) —
  don't assume `formJSON` has the field list if building the native-form off-ramp.
- **Column header labels can vary slightly submission-to-submission** if a Jotform
  form's question text was edited over time (Jotform doesn't version field text).
  `getSubmissionColumns` keys by field `name` and takes whichever `text` it sees
  first when scanning newest-first — cosmetic only, data itself is unaffected, not
  fixed.
- `Events` collection is `adminOnly` on read (`src/collections/Events.ts`). The
  planned Calendar page merges Events with internal activities — as-is, a non-admin
  editor would see an empty calendar. Needs fixing before Calendar is built.
- `.planning/STATE.md` and `ROADMAP.md` still track the February CSV Import Tool as
  current work. They were never updated to reflect the dashboard project and are
  stale as of this session — worth a GSD re-plan if the team wants to use that
  workflow for the dashboard going forward, but that wasn't done tonight.
- Roster spreadsheet still not shared — still the real blocker on roster/dues schema,
  per "Open Questions" below.

## What We're Building

A friendly admin dashboard for Italia Lacrosse staff/board — a front end over the
existing Payload CMS data. Payload's own admin UI is too technical for the
less tech-savvy people on the team.

**Pages:** Overview (rollup) · Projects · Contacts · Form Submissions · Calendar
**UI kit:** ShadCN. Jason has UI ideas sketched in Paper.
**Reference template:** https://github.com/arhamkhnz/next-shadcn-admin-dashboard-baseui
(use as a component/layout *source*, NOT as a separate deployed app — see decisions)

## The Organization

Italia Lacrosse is a sports organization / non-profit fielding Italian national
lacrosse teams plus exhibition teams.

### Teams

| Type | Teams |
|------|-------|
| National | Men's Sixes, Men's Field, Men's U20, Women's Sixes, Women's Field |
| Exhibition ("Heritage Team") | Men's, Women's, Boys, Girls |

- Players share one pool — national down to exhibition.
- **National team eligibility requires Italian citizenship.** Exhibition does not.
- **Rosters change per tournament** (tryouts/call-ups) — NOT a fixed yearly roster.
- Heritage/exhibition teams have their own separate schedule from sanctioned tournaments.

### People & Committees

Everyone pitches in, but work splits along committees:
- Fundraising (needs its own dashboard section)
- Player acquisition & citizenship
- Social media & communications

### Money

- Fundraising is mostly **individual donors** and **ticketed events** (galas).
- **Dues/fees:** players and parents pay. Amount **varies per player/event**.
  Tracked today as a checkbox on the roster spreadsheet. "Paid / not paid" is
  enough for v1 — no payment method/date tracking needed yet.

### Content

- Jason writes all the articles himself.
- Publishing isn't the bottleneck — the bottleneck is *"do I have enough info
  to make a post?"* Worth considering on the Overview page.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Dashboard lives **in this repo** as a new route group (e.g. `src/app/(dashboard)`) | Payload Local API talks to D1 in-process (no HTTP hop, no REST auth, no rate limits); reuses existing Next.js session; one Worker deploy. A separate app would need its own login flow + Cloudflare project. |
| **Reuse Payload Users/login** | Same accounts/roles as the Payload admin. Only stays a one-line `req.user` check if the dashboard shares the same Next.js session. |
| Starter template = **reference only**, not a second app | It's a standalone Next.js project with its own root layout/providers. Copy its sidebar/layout/shadcn patterns in; don't deploy it separately. |
| **Calendar merges** new internal meetings + existing `Events` | One view for "what's coming up." |
| **Projects have sub-tasks** | Asana-style: each project has a checklist w/ assignees + deadlines. |
| **Jotform → webhook → `form-submissions`** (originally recommended; what actually got built 2026-07-17 is a manual pull script instead, per Jason's "just test it out now" ask — webhook is still the better long-term answer, not yet built) | Keeps a permanent record in our DB, no rate limits on page load, and links to Contacts the way the schema already anticipates. Live API calls would lose all that. |
| Native Forms are the later **off-ramp** from Jotform | `Forms` + `FormSubmissions` collections already exist. A native form writes to the same `form-submissions` table, so the dashboard needs no changes when Jotform goes away. |
| **Do not tag meetings/camps/galas onto `Events`** | See "Events is tournament-only" below. Needs a separate collection. NOT finalized — Jason wanted to re-approach from needs first. |

## Codebase Findings (verified, not assumed)

**Stack:** Payload 3.73 · Next.js 15 · Cloudflare Workers (OpenNext) · D1 (SQLite) · R2

**Collections:** Posts, Categories, Events, Teams, Players, Coaches, Contacts, Users,
Media, Forms, FormSubmissions

- **`Contacts` is real and well-built.** Full schema: contactType (player/donor/coach),
  program, citizenship, status, lineage, address group, player details, and a
  `sourceFormSubmission` relationship to `form-submissions`. ~1,800 contacts imported.
- **`Teams` and `Players` are PUBLIC WEBSITE CONTENT, not an operational roster system.**
  `Teams` = page-builder (hero/about/images sections) for team landing pages.
  `Players` = bio + headshot cards. Do not mistake these for roster infrastructure.
- **No roster model exists at all.** Nothing tracks "which contacts are on which
  roster for which tournament." This is greenfield.
- **No dues/fees data exists.** Greenfield.
- **Jotform integration exists as of 2026-07-17** (`tools/sync-jotform.mjs`, manual
  pull, not a live webhook — see Build Progress below). 1,183 real submissions
  across 18 forms are in local dev D1. Not yet linked to Contacts.
- **`Events` is tournament-only.** It *requires* a `team` relationship and
  auto-generates its name from `year + team + eventType` → "2026 Men's World
  Championship". A training camp or gala has no national team and would break
  that hook. Leave it alone; add a separate collection for internal activities.
- **`Users`** has admin/editor roles; first user auto-becomes admin.
- **Access control** lives in `src/access/` — `anyone`, `authenticated`,
  `authenticatedOrPublished`, `adminOnly`.
- **shadcn is NOT set up in this repo** — no `components.json` yet.
- There IS already custom Payload admin work: custom Nav, Logo/Icon graphics, and a
  `total-contacts` dashboard widget (`src/widgets/TotalUsers.tsx`).

## What Jason Wants The Dashboard To Do

- Everyone can manage contacts and **create rosters** — pick a program, pick a
  tournament, assemble a roster from existing Contacts.
- Show **citizenship status** when building a national roster. v1: display status
  only, no hard block — a human decides.
- Clean solution for **dues tracking** (replacing the spreadsheet checkbox).
- See **Jotform sign-ups** easily in the dashboard. *(Largely done as of 2026-07-17 —
  see Build Progress. Still manual-sync only, no live webhook, no Contacts linking.)*
- A **fundraising section** for that committee.

## Open Questions / Next Steps

1. **Jason was about to share the roster spreadsheet** so we can model the roster/dues
   schema off what they actually use. *Get this first — it drives the schema.*
   Key unknown: is "dues" one fee or several line items (camp fee, travel fee, etc.)?
2. Meetings/camps/galas collection — shape not finalized (was mid-conversation).
3. Is the Heritage Team one entity with 4 squads, or 4 separate teams? (Affects roster model.)
4. Projects/Meetings collection schemas — drafted in conversation, never written to code.

## Not Yet Done (carried over)

- **`team` multi-select on Posts**: Jason wants a multi-select `teams` relationship in
  the Posts sidebar below `authors`. Complication: an unused single-select
  `relatedTeam` field already exists (referenced only in `Posts.ts` itself +
  `defaultPopulate`; null on every post). Decision pending: replace it vs. add
  alongside. Recommendation: replace — it's dead and does the same job.
  Note: single relationship = FK column (`related_team_id`); hasMany = `posts_rels`
  join table. Converting is a real migration.
- 30 imported posts sit as **drafts** awaiting bulk-publish (10 published as of writing).
- An **empty untitled draft** (post id 2, from February) should be deleted.

## Landmines

- **Never delete/reset migrations.** All 9 are applied to production D1. See CLAUDE.md.
- **`forms` table has pre-existing schema drift.** `payload migrate:create` prompts
  interactively about `form_j_s_o_n` being created vs. renamed from `fields`/`is_active`/
  etc. Don't guess — hand-write additive migrations instead (see
  `20260716_185517_add_posts_photo_attribution.ts` for the pattern).
- **Local D1's migration ledger is out of sync** with its pushed schema; `pnpm payload
  migrate` fails locally with "table `forms` already exists". Production is fine.
  Local dev relies on Payload's dev-mode schema push. `rm -rf .wrangler` resets local.
- **Versions tables need migrating too.** Posts has drafts enabled, so a new field
  needs adding to BOTH `posts` and `_posts_v` (`version_<field>`). Missing the
  second one only fails at write time.
- **Local scripts + Buffer:** uploading a Node `Buffer` through the local Miniflare/R2
  proxy fails with `false == true`. Use `new Uint8Array(buffer)`.
- **Upload node IDs:** `convertHTMLToLexical` reads media IDs from HTML attrs as
  strings; D1 needs numbers. See `fixUploadNodeIds` in `tools/import-divhunt-posts.mjs`.
- **`pnpm deploy` is a pnpm builtin** — you must run `pnpm run deploy`.
- **`_status`**: on update, `draft: false` alone won't publish. Set `_status: 'published'`.

---
*Discovery captured 2026-07-16. Nothing here is built yet.*
