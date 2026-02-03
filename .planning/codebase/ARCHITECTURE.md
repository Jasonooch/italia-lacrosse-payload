# Architecture

**Analysis Date:** 2026-02-02

## Pattern Overview

**Overall:** Headless CMS with Payload 3.73.0 + Next.js 15 App Router deployed on Cloudflare Workers

**Key Characteristics:**
- Payload CMS drives data and admin panel; Next.js provides frontend and API routing
- Database and storage abstracted through plugins (`@payloadcms/db-d1-sqlite`, `@payloadcms/storage-r2`)
- Access control enforced at collection level with reusable functions
- Rich text editing via Lexical with custom blocks (Banner, Button, Code, MediaBlock)
- Versioning and scheduled publishing on Posts collection

## Layers

**Admin/UI Layer:**
- Purpose: Payload CMS admin panel with custom branding and widgets
- Location: `src/app/(payload)/admin`
- Contains: Admin overrides, custom logo/icon components, import map configuration
- Depends on: Collections, access control, hooks
- Used by: Authenticated users (admin/editor roles)

**API Layer:**
- Purpose: REST and GraphQL endpoints for data access
- Location: `src/app/(payload)/api`
- Contains: Auto-generated REST handlers (`[...slug]/route.ts`), GraphQL playground
- Depends on: Payload config, collections
- Used by: Frontend, external clients

**Frontend Layer:**
- Purpose: Public-facing Next.js pages and user-facing functionality
- Location: `src/app/(frontend)`
- Contains: Public pages (home), future public routes
- Depends on: Payload Local API for authenticated data fetching
- Used by: Public visitors, search engines

**Collections Layer (Data Model):**
- Purpose: Define CMS content schemas and data structure
- Location: `src/collections/`
- Contains: 11 collections (Users, Media, Posts, Teams, Players, Coaches, Events, Categories, Contacts, Forms, FormSubmissions)
- Depends on: Access control functions, hooks, fields, blocks
- Used by: Admin panel, API, frontend

**Configuration Layer:**
- Purpose: Bootstrap Payload CMS and Next.js application
- Location: `src/payload.config.ts`
- Contains: Collection registration, plugin setup, editor config, database/storage binding
- Depends on: All collections, all plugins
- Used by: Entire application at startup

## Data Flow

**Admin Create/Update:**

1. Admin panel UI (Payload admin) calls REST/GraphQL API endpoint
2. Endpoint validates against access control (e.g., `adminOnly` for Posts)
3. Hooks execute (beforeChange, beforeValidate) - auto-generate slugs, organize media, etc.
4. Data persists to Cloudflare D1 SQLite database
5. Hooks execute (afterChange) - trigger side effects like folder organization
6. Response returns to admin UI

**Frontend Data Fetch:**

1. Next.js page component calls `getPayload()` to initialize Payload Local API
2. Frontend authenticates user via headers using `payload.auth()`
3. Page fetches data with `payload.find()` or `payload.findByID()`
4. Access control evaluated - `authenticatedOrPublished` allows public read of published content
5. Data rendered as HTML/JSON response

**Media Upload:**

1. Admin uploads file through Media collection upload UI
2. File stored in Cloudflare R2 bucket via `@payloadcms/storage-r2` plugin
3. Media document created in database with R2 reference
4. Multiple image sizes generated automatically (thumbnail, square, postHero, etc.)
5. Hooks organize media into folder structure

**State Management:**

- Payload handles all state persistence to D1
- No additional state management tool (Redux, Zustand, etc.)
- Component-level React state in admin UI
- Next.js builds static where possible, Server Components for dynamic content

## Key Abstractions

**Access Control:**
- Purpose: Protect collections from unauthorized access
- Examples: `src/access/authenticated.ts`, `src/access/adminOnly.ts`, `src/access/authenticatedOrPublished.ts`
- Pattern: Each access function returns boolean or WhereBuilder object; used in `access` config of each collection

**Slug Generation:**
- Purpose: Auto-generate URL-safe slugs from source fields (title, name)
- Examples: `src/fields/slug.ts` used in Posts, Teams, Events
- Pattern: Returns Field[] array with beforeValidate hook; spreads into collection fields with `...slugField('fieldName')`

**Media Organization:**
- Purpose: Auto-organize uploaded media into folders by context
- Examples: `src/hooks/autoOrganizeMedia.ts` hooks into collection afterChange events
- Pattern: Hook factory takes folderName and fieldName; manages Payload folders collection

**Rich Text Blocks:**
- Purpose: Composable content blocks for Posts content
- Examples: `src/blocks/Banner/config.ts`, `src/blocks/Code/config.ts`, `src/blocks/MediaBlock/config.ts`, `src/blocks/Button/config.ts`
- Pattern: Each block exports Block config with slug and fields; registered in Posts collection Lexical editor

## Entry Points

**Payload Config:**
- Location: `src/payload.config.ts`
- Triggers: Application startup, `pnpm dev`, `pnpm build`, migrations
- Responsibilities: Initialize CMS with collections, plugins, database, storage, email, admin customization

**Next.js App Router:**
- Location: `src/app/` (both `(payload)` and `(frontend)` route groups)
- Triggers: HTTP requests
- Responsibilities: Route requests to admin panel, API endpoints, or frontend pages

**Frontend Home Page:**
- Location: `src/app/(frontend)/page.tsx`
- Triggers: GET / request
- Responsibilities: Fetch user auth status, display welcome page or authenticated greeting

**API Catch-All:**
- Location: `src/app/(payload)/api/[...slug]/route.ts`
- Triggers: Any API request under /api
- Responsibilities: Auto-generated by Payload - handles REST endpoints for all collections

**Admin Catch-All:**
- Location: `src/app/(payload)/admin/[[...segments]]/route.ts`
- Triggers: Admin panel navigation requests
- Responsibilities: Payload admin panel - renders CMS UI

## Error Handling

**Strategy:** Plugin-based with graceful degradation

**Patterns:**
- Hooks log errors but don't block operations (e.g., media organization failure logs warning but upload succeeds)
- Validation errors caught at field level with `validate` function returning string error message
- Access control failures return 403 Forbidden
- Database errors propagate up through Payload error handler

## Cross-Cutting Concerns

**Logging:** Payload Logger via `req.payload.logger` (info, warn, error methods)

**Validation:**
- Field-level via `validate` function returning boolean/error string
- Relationship validation automatic (relationTo enforced)
- URL validation in Events collection (`eventWebsite` field)

**Authentication:**
- Users collection with auth: true
- Role-based access (admin, editor roles)
- JWT tokens via PAYLOAD_SECRET environment variable
- Session persisted in request object for entire request lifecycle

**Relationships:**
- Enforced through `relationTo` field config
- Relationships populated based on collection `defaultPopulate` config
- CircularReference prevention (Posts self-referential relatedPosts filters out self)

---

*Architecture analysis: 2026-02-02*
