# Codebase Structure

**Analysis Date:** 2026-02-02

## Directory Layout

```
src/
├── access/                 # Access control functions
├── app/                    # Next.js App Router
│   ├── (frontend)/        # Public-facing pages
│   ├── (payload)/         # Admin panel & API routes
│   └── my-route/          # Example custom route
├── blocks/                # Lexical rich text editor blocks
│   ├── Banner/
│   ├── Button/
│   ├── Code/
│   └── MediaBlock/
├── collections/           # Payload CMS data collections
├── components/            # React components
│   └── admin/            # Admin panel custom components
├── fields/               # Reusable field configurations
├── hooks/                # Custom Payload hooks
├── migrations/           # Database migrations
├── widgets/              # Admin dashboard widgets
├── payload.config.ts     # Main Payload CMS configuration
└── payload-types.ts      # Auto-generated TypeScript types

public/                    # Static assets
tests/                     # Test suites
├── int/                  # Integration tests
└── e2e/                  # End-to-end Playwright tests

tools/                    # Utility scripts and plugins
.planning/               # GSD documentation (this file)
```

## Directory Purposes

**`src/access/`:**
- Purpose: Reusable access control decision functions
- Contains: Function exports matching Payload Access pattern
- Key files: `authenticated.ts`, `adminOnly.ts`, `authenticatedOrPublished.ts`, `anyone.ts`

**`src/app/(frontend)/`:**
- Purpose: Public-facing Next.js pages and routes
- Contains: Server Components for marketing site, public pages
- Key files: `page.tsx` (home), `layout.tsx`, `styles.css`

**`src/app/(payload)/admin/`:**
- Purpose: Payload CMS admin panel configuration and overrides
- Contains: Custom logo/icon components, dashboard widgets, import map
- Key files: `importMap.js`, `contacts-import-export/` (custom admin section), `[[...segments]]/` (admin catch-all)

**`src/app/(payload)/api/`:**
- Purpose: Payload REST and GraphQL API endpoints
- Contains: Auto-generated route handlers by Payload
- Key files: `[...slug]/route.ts` (REST catch-all), `graphql/`, `graphql-playground/`

**`src/blocks/`:**
- Purpose: Lexical rich text editor block definitions
- Contains: Block configuration, Client Components for block rendering
- Key files: `Banner/config.ts`, `Button/config.ts`, `Code/config.ts`, `MediaBlock/config.ts`

**`src/collections/`:**
- Purpose: Payload collection definitions (data schemas)
- Contains: 11 collection exports defining fields, access, hooks, timestamps
- Key files: Users, Media, Posts, Teams, Players, Coaches, Events, Contacts, Categories, Forms, FormSubmissions

**`src/components/admin/`:**
- Purpose: Admin panel UI customizations
- Contains: Custom Logo, Icon components for white-labeling
- Key files: `Logo.tsx`, `Icon.tsx`

**`src/fields/`:**
- Purpose: Reusable field factory functions
- Contains: Field definitions spread into multiple collections
- Key files: `slug.ts` (auto-slug generation for Posts, Teams, Events)

**`src/hooks/`:**
- Purpose: Payload lifecycle hooks (beforeChange, afterChange, beforeValidate, etc.)
- Contains: Hook factories and implementations
- Key files: `autoOrganizeMedia.ts` (organizes media uploads into folders)

**`src/migrations/`:**
- Purpose: Database schema migration history
- Contains: Incremental SQL/TypeScript migrations tracking schema evolution
- Key files: Timestamped migrations (20260118_195739.ts, etc.), index.ts loader

**`src/widgets/`:**
- Purpose: Admin dashboard widgets for metrics/data visualization
- Contains: React components rendered in dashboard
- Key files: `TotalUsers.tsx` (displays total contacts count)

**`tests/int/`:**
- Purpose: Integration tests for Payload functionality
- Contains: Vitest test files ending in `.int.spec.ts`
- Execution: `pnpm test:int`

**`tests/e2e/`:**
- Purpose: End-to-end browser tests
- Contains: Playwright test files
- Execution: `pnpm test:e2e`

**`tools/`:**
- Purpose: Utility scripts and development tools
- Contains: Data import/export scripts, Claude plugin reference
- Key files: `import-contacts.mjs` (CSV import for Contacts)

## Key File Locations

**Entry Points:**
- `src/payload.config.ts`: Payload CMS initialization - all collections, plugins, database registered
- `src/app/(frontend)/page.tsx`: Public home page - fetches user auth status
- `src/app/(payload)/admin/[[...segments]]/route.ts`: Admin panel entry point (Payload-generated)
- `src/app/(payload)/api/[...slug]/route.ts`: API endpoint catch-all (Payload-generated)

**Configuration:**
- `src/payload.config.ts`: Main CMS configuration, collection registration, plugin setup
- `wrangler.jsonc`: Cloudflare D1 and R2 bindings (in project root)
- `next.config.ts`: Next.js configuration with Payload wrapper (in project root)
- `open-next.config.ts`: OpenNext.js adapter for Cloudflare (in project root)

**Core Logic:**
- `src/collections/`: All data model definitions (Posts, Teams, Events, Contacts, etc.)
- `src/access/`: Permission logic for read/create/update/delete operations
- `src/hooks/`: Automatic behaviors (slug generation, media organization, author assignment)
- `src/blocks/`: Rich text editor extensions (Banner, Code, Button, MediaBlock)

**Testing:**
- `tests/int/`: Integration test files following `.int.spec.ts` pattern
- `tests/e2e/`: Playwright end-to-end tests
- `playwright.config.ts`: Playwright configuration (in project root)
- `vitest.config.mts`: Vitest configuration for integration tests (in project root)

## Naming Conventions

**Files:**
- Collection definitions: PascalCase (e.g., `Posts.ts`, `Teams.ts`, `Users.ts`)
- Access functions: camelCase (e.g., `authenticatedOrPublished.ts`, `adminOnly.ts`)
- Block configs: PascalCase with /config.ts suffix (e.g., `Banner/config.ts`)
- Hooks: camelCase (e.g., `autoOrganizeMedia.ts`)
- Fields: camelCase (e.g., `slug.ts`)
- Tests: camelCase with test runner suffix (e.g., `someName.int.spec.ts`, `someName.spec.ts`)

**Directories:**
- Feature/domain directories: kebab-case or PascalCase following content type (e.g., `(frontend)`, `(payload)`, `MediaBlock`)
- Utility directories: lowercase (e.g., `access`, `hooks`, `fields`, `blocks`)
- Route group directories: kebab-case wrapped in parentheses (e.g., `(frontend)`, `(payload)`)

**TypeScript:**
- Types auto-generated in `src/payload-types.ts` from collection schemas
- Import types with `import type { ... } from 'payload'`
- Use `CollectionConfig` type for collection definitions
- Use `Access`, `CollectionAfterChangeHook`, etc. for hooks and access functions

## Where to Add New Code

**New Collection/Content Type:**
- Definition file: `src/collections/YourCollection.ts`
- Pattern: Export `CollectionConfig` with slug, fields, access, hooks
- Register: Add import and entry to `payload.config.ts` collections array
- Types: Run `pnpm generate:types` after adding collection
- Access: Use existing functions from `src/access/` or create new ones

**New Field Type (Reusable):**
- Field factory: `src/fields/yourField.ts`
- Pattern: Export function returning `Field[]` array
- Usage: Spread into collection with `...yourField('params')`
- Example: `src/fields/slug.ts` - returns Field array with hooks for auto-slug

**New Hook (Automatic Behavior):**
- Hook factory: `src/hooks/yourHook.ts`
- Pattern: Export function returning `CollectionAfterChangeHook | CollectionBeforeChangeHook | etc.`
- Usage: Pass to collection's `hooks.beforeChange` or `hooks.afterChange` array
- Example: `src/hooks/autoOrganizeMedia.ts` - organizes media into folders

**New Rich Text Block:**
- Block directory: `src/blocks/YourBlock/`
- Files needed: `config.ts` (Lexical block definition), `Component.tsx` (optional, for frontend rendering)
- Pattern: Export Block config from config.ts with slug and fields
- Register: Import and add to Posts collection lexicalEditor `BlocksFeature({ blocks: [...] })`
- Example: `src/blocks/Banner/` - displays styled alert box in Posts content

**New Admin Component (Logo, Icon, Custom UI):**
- Component file: `src/components/admin/YourComponent.tsx`
- Usage: Reference in `payload.config.ts` admin.components with path string
- Example: `'./components/admin/Logo.tsx#default'` for custom admin logo

**New Admin Dashboard Widget:**
- Widget file: `src/widgets/YourWidget.tsx`
- Pattern: React component that queries Payload Local API
- Register: Add to `payload.config.ts` admin.dashboard.widgets array with slug and ComponentPath
- Example: `src/widgets/TotalUsers.tsx` - displays count of contacts

**New Frontend Page:**
- Page file: `src/app/(frontend)/your-page/page.tsx`
- Pattern: Async Server Component, fetch data with `getPayload().find()`
- Authentication: Call `payload.auth({ headers })` to check user status
- Access control: Access functions applied automatically based on collection config

**New API Route (Custom):**
- Route file: `src/app/(payload)/api/custom-route/route.ts` or use catch-all `[...slug]`
- Pattern: Export GET, POST, etc. functions
- Note: Standard REST endpoints auto-generated by Payload for all collections
- Example: Custom webhook handler, third-party integration endpoint

**New Test:**
- Integration test: `tests/int/your-feature.int.spec.ts`
- E2E test: `tests/e2e/your-feature.spec.ts`
- Run: `pnpm test:int` or `pnpm test:e2e`

## Special Directories

**`src/migrations/`:**
- Purpose: Track database schema changes incrementally
- Generated: `pnpm payload migrate:create` creates new timestamped migration
- Committed: Yes - migrations must be in git for deployment
- Pattern: Migrations run sequentially during `pnpm dev` and `pnpm deploy:database`
- Critical: Never delete old migrations once deployed - database tracks which have run

**`src/payload-types.ts`:**
- Purpose: Auto-generated TypeScript definitions for all collections
- Generated: `pnpm generate:types:payload`
- Committed: Yes - generated types included in git
- Regenerate: After any schema changes, run command before committing

**`cloudflare-env.d.ts`:**
- Purpose: Auto-generated TypeScript bindings for Cloudflare environment (D1, R2, etc.)
- Generated: `pnpm generate:types:cloudflare`
- Committed: Yes - generated types included in git

**`.next/` and `.open-next/`:**
- Purpose: Build output directories
- Generated: `pnpm build`, `pnpm dev`
- Committed: No - in .gitignore
- Clean: `rm -rf .next .open-next` before clean build

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: `pnpm install`
- Committed: No - in .gitignore

**`.planning/codebase/`:**
- Purpose: GSD (GSD architecture documentation)
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md
- Committed: Yes - guidance docs for future development
- Usage: Reference when planning/executing code changes

---

*Structure analysis: 2026-02-02*
