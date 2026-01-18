# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Italia Lacrosse Payload CMS - a headless CMS for an Italian lacrosse organization built with Payload CMS 3.70.0, Next.js 15, and deployed on Cloudflare Workers with D1 SQLite database and R2 storage.

## Commands

```bash
# Development
pnpm dev              # Start dev server (auto-binds Cloudflare services)
pnpm devsafe          # Clean build and start dev server
pnpm generate:types   # Regenerate types after schema changes (IMPORTANT!)

# Testing
pnpm test             # Run all tests
pnpm test:int         # Vitest integration tests (tests/int/**/*.int.spec.ts)
pnpm test:e2e         # Playwright e2e tests

# Build & Deploy
pnpm build            # Production build
pnpm deploy           # Full deploy (migrate + build + deploy to Cloudflare)
pnpm deploy:database  # Run migrations on Cloudflare D1

# Database
pnpm payload migrate:create  # Create new migration after schema changes
```

## Architecture

### Stack
- **CMS**: Payload CMS 3.70.0 with Lexical rich text editor
- **Framework**: Next.js 15 (App Router)
- **Database**: Cloudflare D1 (SQLite) via `@payloadcms/db-d1-sqlite`
- **Storage**: Cloudflare R2 via `@payloadcms/storage-r2`
- **Deployment**: Cloudflare Workers via OpenNext.js adapter

### Key Directories
```
src/
├── collections/        # Data collections (8 total)
├── blocks/            # Rich text editor blocks (Banner, Button, Code, MediaBlock)
├── fields/            # Reusable field configs (slug.ts for auto-slug generation)
├── access/            # Access control functions (anyone, authenticated, authenticatedOrPublished)
├── hooks/             # Custom hooks (autoOrganizeMedia)
├── migrations/        # Database migrations
├── app/(frontend)/    # Public pages
├── app/(payload)/     # Admin panel & API routes
└── payload.config.ts  # Main configuration
```

### Collections
- **Users**: Auth with admin/editor roles
- **Media**: Uploads with 8 image sizes, folder organization
- **Posts**: Blog with versioning, SEO plugin, scheduled publishing
- **Teams**: Page builder sections (hero, about, coaching staff, images)
- **Events**: Championships/tournaments with team/coach relationships
- **Coaches, Players, Categories**: Supporting collections

### Access Control Pattern
Three-tier access functions in `src/access/`:
- `anyone` - Public read
- `authenticated` - Login required
- `authenticatedOrPublished` - Public sees published, authenticated sees drafts

## Critical Patterns

### 1. Type Generation
Always run `pnpm generate:types` after modifying collection schemas. Types output to `src/payload-types.ts`.

### 2. Local API Access Control
By default, Local API bypasses access control. When operating on behalf of a user:
```typescript
// ✅ Correct - enforces permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false,  // REQUIRED
})
```

### 3. Transaction Safety in Hooks
Always pass `req` to nested operations in hooks for atomic transactions:
```typescript
afterChange: [async ({ doc, req }) => {
  await req.payload.create({
    collection: 'audit-log',
    data: { docId: doc.id },
    req,  // Maintains atomicity
  })
}]
```

### 4. Prevent Hook Loops
Use context flags when hooks trigger operations on the same collection:
```typescript
if (context.skipHooks) return
await req.payload.update({
  // ...
  context: { skipHooks: true },
  req,
})
```

### 5. Slug Generation
Use the centralized slug utility in `src/fields/slug.ts` for auto-generating URL-friendly slugs from source fields.

### 6. Migration Best Practices (IMPORTANT)
**NEVER reset/delete migrations once deployed to production.** The remote D1 database tracks which migrations have run. If you delete old migrations and create a fresh one:
- The remote DB still has old tables
- The new migration tries to create tables that already exist
- Deploy fails

**Always use incremental migrations:**
```bash
# After schema changes, create a NEW migration (don't delete old ones)
pnpm payload migrate:create
```

If migrations get out of sync with remote DB, you must either:
1. Add missing columns via `ALTER TABLE` commands
2. Wipe the remote database (loses all data) and redeploy

## Configuration Files

- `payload.config.ts` - Main CMS config, collections, plugins
- `wrangler.jsonc` - Cloudflare D1/R2 bindings
- `next.config.ts` - Next.js with `withPayload()` wrapper
- `open-next.config.ts` - OpenNext.js adapter for Cloudflare

## Environment Variables

Required:
- `PAYLOAD_SECRET` - JWT signing secret (generate: `openssl rand -hex 32`)

Cloudflare bindings (configured in wrangler.jsonc):
- `D1` - Database binding
- `R2` - File storage binding

## Additional Documentation

Detailed Payload patterns in `.cursor/rules/`:
- `payload-overview.md` - Core patterns and quick reference
- `collections.md` - Collection configuration patterns
- `access-control.md` / `access-control-advanced.md` - Access patterns
- `hooks.md` - Hook lifecycle and patterns
- `security-critical.mdc` - Security best practices

Payload docs: https://payloadcms.com/docs
