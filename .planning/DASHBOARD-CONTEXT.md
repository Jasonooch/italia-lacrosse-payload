# Admin Dashboard — Discovery Context

**Captured:** 2026-07-16
**Status:** Pre-planning. No dashboard code written yet.
**Purpose:** Hand-off doc. Everything below came out of a discovery conversation and is
not derivable from the codebase. Read this before planning the dashboard.

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
| **Jotform → webhook → `form-submissions`** (recommended, not yet built) | Keeps a permanent record in our DB, no rate limits on page load, and links to Contacts the way the schema already anticipates. Live API calls would lose all that. |
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
- **No Jotform integration exists** in the codebase. Submissions are not flowing in.
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
- See **Jotform sign-ups** easily in the dashboard.
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
