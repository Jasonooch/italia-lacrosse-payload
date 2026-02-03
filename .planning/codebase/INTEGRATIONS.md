# External Integrations

**Analysis Date:** 2026-02-02

## APIs & External Services

**Email Delivery:**
- Resend - Email service for transactional emails
  - SDK/Client: @payloadcms/email-resend 3.73.0
  - Auth: `RESEND_API_KEY` env var
  - Configuration: `src/payload.config.ts` lines 76-80
  - Default sender: noreply@italialacrosse.com (Italia Lacrosse)

**SEO Management:**
- Built-in SEO Plugin - Metadata generation and management
  - SDK/Client: @payloadcms/plugin-seo 3.73.0
  - Configuration: `src/payload.config.ts` lines 90-97
  - Generates dynamic titles, descriptions, and URLs based on document data
  - Upload collection: media

## Data Storage

**Databases:**
- Cloudflare D1 (SQLite)
  - Connection: Wrangler binding "D1"
  - Database ID: 4dee9c0b-6280-4eea-b14e-ef6ef45606c1
  - Database name: italia-lacrosse-cms-db
  - Remote: true (production D1 instance)
  - Client: @payloadcms/db-d1-sqlite 3.73.0
  - Adapter: `sqliteD1Adapter({ binding: cloudflare.env.D1 })`
  - Location: `src/payload.config.ts` line 84

**File Storage:**
- Cloudflare R2 (Object Storage)
  - Bucket name: italia-lacrosse-media
  - Preview bucket: italia-lacrosse-media
  - Client: @payloadcms/storage-r2 3.73.0
  - Binding: Wrangler "R2"
  - Collections: media collection uploads
  - Configuration: `src/payload.config.ts` lines 86-89
  - Upload sizes: 8 image variants (thumbnail, square, teamCard, small, medium, postHero, large, xlarge, og)

**Caching:**
- Not explicitly configured (can be added via NEXT_INC_CACHE_R2_BUCKET binding in wrangler.jsonc)

## Authentication & Identity

**Auth Provider:**
- Custom Payload CMS auth - Built-in authentication system
  - Implementation: Users collection with admin/editor roles
  - Location: `src/collections/Users.ts`
  - JWT signing: `PAYLOAD_SECRET` environment variable
  - Access control: Token-based with role-based access patterns in `src/access/`

**User Management:**
- Payload built-in user/admin system
  - Users collection slug: 'users'
  - Admin dashboard: User authentication required for `/admin` routes

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, DataDog, or similar configured)

**Logs:**
- Console logging (standard Node.js/browser console)
- Cloudflare Worker logs available via wrangler CLI

**Database Migrations:**
- Version control via numbered migration files in `src/migrations/`
- Tracked via Cloudflare D1 migration history
- Run with: `pnpm payload migrate:create` for new migrations
- Run with: `pnpm deploy:database` for production deployment

## CI/CD & Deployment

**Hosting:**
- Cloudflare Workers platform
- OpenNext.js adapter for Next.js App Router compatibility
- Entry point: `.open-next/worker.js`

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, or similar configured)
- Manual deployment via CLI

**Deployment Process:**
- `pnpm deploy` - Full deployment (database migrations + build + Cloudflare deploy)
- `pnpm deploy:app` - App deployment only
- `pnpm deploy:database` - Database migrations and PRAGMA optimize
- Build: OpenNext.js adapter compilation
- Assets: Served from `.open-next/assets` directory

## Environment Configuration

**Required env vars:**
- `PAYLOAD_SECRET` - JWT signing key (generate: `openssl rand -hex 32`)
- `RESEND_API_KEY` - Email service API key
- `FRONTEND_URL` - Frontend base URL for SEO URLs (optional, defaults to https://italialacrosse.com)
- `CLOUDFLARE_ENV` - Environment selector for wrangler deployments (optional)
- `NODE_ENV` - production/development

**Secrets location:**
- `.env` file (local development)
- Cloudflare Workers environment variables (production)
- Wrangler `wrangler.jsonc` configured bindings for D1 and R2

**Wrangler Bindings:**
- D1: Database binding for Cloudflare D1
- R2: Storage binding for Cloudflare R2
- ASSETS: Static assets binding

## Webhooks & Callbacks

**Incoming:**
- GraphQL API: `src/app/(payload)/api/graphql/route.ts`
- GraphQL Playground: `src/app/(payload)/api/graphql-playground/route.ts`
- REST API: `src/app/(payload)/api/[...slug]/route.ts`
- Form submission handling: FormSubmissions collection for form data

**Outgoing:**
- Email via Resend API (transactional emails from payload operations)
- No webhook outgoing endpoints detected

**Collection Hooks:**
- Contacts collection: `createdBy` field auto-populates on creation via beforeChange hook
- Media auto-organization via `src/hooks/autoOrganizeMedia.ts`
- SEO plugin generates metadata hooks

## Form Builder Integration

**Forms Plugin:**
- Custom form builder integrated via Payload Forms collection
- Location: `src/collections/Forms.ts` and `src/collections/FormSubmissions.ts`
- Form submission processing: FormSubmissions collection
- Integration guide: `FORM_BUILDER_GUIDE.md`

## Data Import/Export

**Import Capabilities:**
- CSV import for Contacts via `tools/import-contacts.mjs`
- Batch contact creation and updating

**Export:**
- CSV export for transformed contact data
- Stored in project root (contacts-transformed.csv example)

---

*Integration audit: 2026-02-02*
