# Codebase Concerns

**Analysis Date:** 2026-02-02

## Security Issues

**Exposed Secrets in Version Control:**
- Issue: `.env` file is tracked in git with actual database credentials, API keys, and JWT secrets
- Files: `.env` (checked into repository)
- Impact: Critical - Production database credentials, Resend email API key, and PAYLOAD_SECRET exposed in git history. Anyone with repository access has database access.
- Current state:
  - `DATABASE_URI=postgresql://postgres:LDvVYepIAPVyTCQNXCGJBVxNXvCCciKK@yamanote.proxy.rlwy.net:49427/railway`
  - `PAYLOAD_SECRET=18cb4934bcf3d6629cb629ed`
  - `RESEND_API_KEY=re_EHXUcvmC_2Hwfq6sRJS4TABZwVZDRXBUC`
- Fix approach:
  1. Immediately rotate all exposed credentials (database password, API keys, JWT secret)
  2. Remove `.env` from git history using `git filter-branch` or `git filter-repo`
  3. Ensure `.env` is in `.gitignore` (it's currently there but damage already done)
  4. Move secrets to environment-specific configuration management (Cloudflare Secrets, Railway environment variables)
  5. Add pre-commit hooks to prevent `.env` files from being committed

**Weak PAYLOAD_SECRET:**
- Issue: `PAYLOAD_SECRET=18cb4934bcf3d6629cb629ed` is 24 characters but appears to be hex-only and lacks full entropy
- Files: `.env`, `src/payload.config.ts` line 73
- Impact: JWT signing secret should be cryptographically secure. Weak secrets compromise authentication.
- Fix approach: Generate new secret with `openssl rand -hex 32` and rotate all user sessions

**Unencrypted Database Connection:**
- Issue: PostgreSQL connection via Railway proxy may not enforce TLS/SSL for client connections
- Files: `.env` (DATABASE_URI)
- Impact: Database credentials and queries may be transmitted in plaintext over network
- Recommendation: Verify Railway connection requires SSL (`sslmode=require` in connection string)

**Missing Access Control in Media Collection:**
- Issue: `src/collections/Media.ts` has unrestricted public read access but no create/delete/update restrictions
- Files: `src/collections/Media.ts` lines 5-7
- Impact: Any authenticated user can potentially upload, modify, or delete media files
- Current config: `access: { read: () => true }` - only read is specified, create/delete/update default to open
- Fix approach: Define explicit access control for all operations:
  ```typescript
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user) && user.role === 'admin',
    delete: ({ req: { user } }) => Boolean(user) && user.role === 'admin',
  }
  ```

**Overly Permissive Posts Access:**
- Issue: Posts collection allows any authenticated user to create, read, and update
- Files: `src/collections/Posts.ts` lines 14-20
- Impact: Any user (including non-editors) can create and modify posts
- Current state: `create: ({ req: { user } }) => Boolean(user)` - no role check
- Fix approach: Add role-based checks to restrict to 'editor' or 'admin' roles

## Tech Debt

**Unencrypted Secrets in payload.config.ts:**
- Issue: Email configuration uses fallback strings without environment variable validation
- Files: `src/payload.config.ts` lines 40-41
- Impact: Default 'yourdomain.com' emails are hardcoded and used if env vars missing
- Problem code:
  ```typescript
  defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
  defaultFromName: process.env.RESEND_FROM_NAME || 'Italia Lacrosse',
  ```
- Fix approach: Throw explicit error if required env vars are missing rather than falling back to placeholder values

**Console Logging in Hooks:**
- Issue: Production logs using `console.log` and `console.error` in hooks
- Files: `src/collections/Rosters.ts` lines 72, 160-161
- Impact: Performance impact in high-volume scenarios; console output not structured/monitored
- Locations:
  1. Line 72: `console.error('Error fetching player for display label:', error)`
  2. Lines 160-161: Logging roster updates on every save
- Fix approach: Replace with structured logging (Payload's built-in `payload.logger` or external logging service)

**Missing Transaction Safety in Rosters Hooks:**
- Issue: `req.payload.findByID()` calls in hooks don't specify `overrideAccess: false`
- Files: `src/collections/Rosters.ts` lines 65-68, 97-100
- Impact: Local API bypasses access control by default. If this data is sensitive, bypasses user permission checks.
- Current problematic code:
  ```typescript
  const player = await req.payload.findByID({
    collection: 'players',
    id: data.player,
  })
  ```
- Fix approach: Add `overrideAccess: false` and pass `req` to maintain transaction atomicity:
  ```typescript
  const player = await req.payload.findByID({
    collection: 'players',
    id: data.player,
    overrideAccess: false,
    req,
  })
  ```

**Duplicated Import Statement:**
- Issue: `src/collections/Posts.ts` imports `CollectionConfig` from 'payload' twice
- Files: `src/collections/Posts.ts` lines 1 and 3
- Impact: Code cleanliness; no functional impact but indicates incomplete refactoring
- Fix approach: Remove line 1

**Inconsistent Collection Exports:**
- Issue: Collections use inconsistent export patterns (named vs default exports)
- Files:
  - Named exports: `src/collections/Users/Users.ts`, `src/collections/Posts.ts`, `src/collections/Categories.ts`
  - Default exports: `src/collections/Rosters.ts`, `src/collections/Tournaments.ts`, `src/collections/Players.ts`, `src/collections/Games.ts`
- Impact: Makes imports inconsistent in `src/payload.config.ts` (some use named, some don't)
- Fix approach: Standardize on named exports throughout (more explicit, tree-shakeable)

**No Database Migrations:**
- Issue: Project has no migration files and uses Payload's auto-sync feature
- Files: No migrations directory in `src/`
- Impact: Cannot track schema changes in version control; schema synchronization is opaque. If migrations need to be applied manually in production, this becomes problematic.
- Risk: Database state divergence between environments
- Fix approach: Create explicit migration files when schema changes:
  ```bash
  pnpm payload migrate:create
  ```

**Missing Null Checks in Slug Hooks:**
- Issue: Slug generation hooks don't handle edge cases properly
- Files:
  - `src/collections/Posts.ts` lines 50-65
  - `src/collections/Players.ts` lines 59-66
  - `src/collections/Tournaments.ts` lines 31-43
- Impact: Potential for empty slugs if firstName/lastName/title are undefined
- Current problem: No validation that generated slug is not empty after sanitization
- Fix approach: Add validation to ensure slug has minimum length, throw error if generation fails

**Incomplete Error Handling in Hooks:**
- Issue: Rosters displayLabel hook catches errors but returns fallback without proper logging
- Files: `src/collections/Rosters.ts` lines 71-74
- Impact: Silently falls back to generic "Player" when player fetch fails, masking underlying issues
- Better approach: Log the error with context (player ID that failed) for debugging

## Fragile Areas

**Rosters Collection - Array Field Validation:**
- Files: `src/collections/Rosters.ts` lines 124-157
- Why fragile:
  - Multiple hooks transform array data (displayLabel, playerCount, title all depend on roster.players)
  - Duplicate detection logic is manual and could be bypassed
  - Jersey number and player validation happens in beforeValidate but references are async
- Safe modification: Add dedicated validation function tested in isolation before modifying hook logic
- Test coverage gaps: No visible test coverage for duplicate detection or validation logic

**Contacts Collection - Conditional Field Logic:**
- Files: `src/collections/Contacts.ts` lines 40-196
- Why fragile: Many fields use `admin.condition` based on `contactType` (player, donor, coach)
- Risk: If contactType values change, UI conditions break silently
- Safe modification: Extract conditional logic to constants
  ```typescript
  const PLAYER_FIELDS = ['program', 'position', 'playerStatus']
  ```

**Access Control Pattern - Implicit User Role:**
- Files: `src/collections/Users/Users.ts` lines 16-21
- Why fragile: User roles are defined as string enum in Users collection, but role checks throughout codebase use string literals
- Risk: Typos in role name strings aren't caught at compile time
- Missing: No TypeScript type definition for role enum
- Safe modification: Create `src/types/user.ts` with const enum or Zod schema for roles

**Custom Image Hook Dependencies:**
- Files: `src/collections/Rosters.ts` line 70 (depends on Player.firstName, Player.lastName existing)
- Why fragile: If Player collection removes or renames firstName/lastName, Rosters breaks silently
- Missing: No relationship validation that referenced collection fields exist

## Performance Bottlenecks

**N+1 Query Problem in Rosters Hooks:**
- Problem: For each player in roster array, `findByID()` is called individually in hooks
- Files: `src/collections/Rosters.ts` lines 62-75
- Scale impact: Roster with 30 players triggers 30 separate database queries
- Improvement path: Batch fetch all player IDs in single query, map results
  ```typescript
  const playerIds = data.players.map(p => p.player).filter(Boolean)
  const playerMap = await Promise.all(
    playerIds.map(id => req.payload.findByID({ collection: 'players', id }))
  )
  ```

**Unoptimized Games createdAt/updatedAt Hooks:**
- Problem: Timestamp hooks run on every change without caching or batching
- Files: `src/collections/Games.ts` lines 92-116
- Impact: Unnecessary date object creation on every save (minor but preventable)
- Better approach: Use Payload's native timestamp handling instead of custom hooks

## Missing Critical Features

**No Audit Logging:**
- Problem: No collection exists to track who modified what and when
- Impact: Cannot track data change history, user actions, or compliance requirements
- Recommendation: Add audit-log collection with afterChange hooks to track all modifications

**No Email Verification:**
- Problem: Contacts collection accepts email addresses without verification
- Files: `src/collections/Contacts.ts` line 32
- Impact: Typos in email addresses are persisted; communications fail silently
- Recommendation: Implement double opt-in email verification workflow

**No Rate Limiting:**
- Problem: No rate limiting on API endpoints or admin panel
- Impact: Vulnerable to brute force attacks, DoS, and spam import operations
- Recommendation: Add rate limiting middleware

**Missing Input Sanitization:**
- Problem: Rich text editor content (Lexical) could potentially contain XSS if not properly sanitized on output
- Files: `src/collections/Posts.ts` line 84
- Recommendation: Ensure frontend sanitizes/escapes Lexical JSON output

**No Backup Strategy:**
- Problem: Using managed Railway PostgreSQL but no documented backup/restore procedure
- Impact: Data loss risk if Railway service fails or data is corrupted
- Recommendation: Implement automated daily backups to R2 storage or external service

## Test Coverage Gaps

**No Test Suite:**
- What's not tested: Zero test files in the codebase
- Files: No `tests/`, `__tests__/`, or `.spec./.test.` files detected
- Risk:
  - Hook logic (slug generation, validation, async operations) untested
  - Access control functions untested
  - Relationship integrity untested
  - API endpoints untested
- Priority: High - Critical paths like roster validation and access control need tests
- Recommendation: Add Vitest with at least:
  1. Unit tests for slug generation hooks
  2. Integration tests for access control
  3. Validation logic tests for duplicate detection
  4. API integration tests

**No E2E Tests:**
- Risk: Admin UI flows (creating posts, managing rosters, importing contacts) untested
- Recommendation: Set up Playwright E2E tests for critical workflows

---

*Concerns audit: 2026-02-02*
