# Technology Stack

**Analysis Date:** 2026-02-02

## Languages

**Primary:**
- TypeScript 5.7.3 - Full codebase (src/, tests/, config files)
- JavaScript - Package scripts and configuration files

**Secondary:**
- React 19.2.1 - UI components in frontend and admin panel
- HTML/CSS - Markup and styling via Next.js

## Runtime

**Environment:**
- Node.js 18.20.2 or >=20.9.0
- Cloudflare Workers via OpenNext.js adapter

**Package Manager:**
- pnpm 9.x or 10.x
- Lockfile: pnpm-lock.yaml (present)

**Built-in Dependencies:**
- sharp (image processing)
- esbuild (bundling)
- unrs-resolver (dependency resolution)

## Frameworks

**Core:**
- Payload CMS 3.73.0 - Headless CMS core
- Next.js 15.4.10 - Full-stack framework with App Router
- @opennextjs/cloudflare 1.11.0 - Cloudflare Workers adapter

**Rich Text Editing:**
- @payloadcms/richtext-lexical 3.73.0 - Lexical editor for rich text fields
- graphql 16.8.1 - GraphQL support (included with Payload)

**Testing:**
- Vitest 3.2.3 - Unit and integration tests (config: `vitest.config.mts`)
- @playwright/test 1.56.1 - E2E tests (config: `playwright.config.ts`)
- @testing-library/react 16.3.0 - React component testing utilities
- jsdom 26.1.0 - DOM simulation for tests

**Build/Dev:**
- Wrangler ~4.46.0 - Cloudflare Workers CLI
- cross-env 7.0.3 - Cross-platform environment variables
- dotenv 16.4.7 - Environment variable loading

## Key Dependencies

**Critical:**
- @payloadcms/db-d1-sqlite 3.73.0 - SQLite D1 database adapter for Cloudflare
- @payloadcms/storage-r2 3.73.0 - Cloudflare R2 file storage integration
- @payloadcms/next 3.73.0 - Payload and Next.js integration
- @payloadcms/ui 3.73.0 - Payload admin UI components

**Plugins:**
- @payloadcms/plugin-seo 3.73.0 - SEO metadata plugin
- @payloadcms/email-resend 3.73.0 - Email delivery via Resend

**Development:**
- ESLint 9.16.0 - Linting (config: `eslint.config.mjs`)
- @eslint/eslintrc 3.3.3 - ESLint configuration
- eslint-config-next 15.4.7 - Next.js ESLint rules
- Prettier 3.4.2 - Code formatting (config: `.prettierrc.json`)
- TypeScript 5.7.3 - Type checking
- @types/node 22.5.4, @types/react 19.2.1, @types/react-dom 19.2.1 - Type definitions

**Utilities:**
- @vitejs/plugin-react 4.5.2 - React support for Vite
- vite-tsconfig-paths 5.1.4 - TypeScript path alias resolution
- playwright-core 1.56.1 - Playwright test engine

## Configuration

**Environment:**
- Configured via `.env` file
- Critical variables:
  - `PAYLOAD_SECRET` - JWT signing secret (required, generated via `openssl rand -hex 32`)
  - `RESEND_API_KEY` - Email service API key
  - `FRONTEND_URL` - Frontend base URL (defaults to https://italialacrosse.com)

**Build:**
- `tsconfig.json` - TypeScript compilation settings (ES2022 target, bundler module resolution)
- `next.config.ts` - Next.js configuration with Payload integration
- `open-next.config.ts` - OpenNext.js Cloudflare adapter configuration
- `wrangler.jsonc` - Cloudflare Workers configuration (D1 database, R2 storage, compatibility flags)
- `prettier.config.json` - Code formatting settings
- `vitest.config.mts` - Vitest integration/unit test configuration
- `playwright.config.ts` - Playwright E2E test configuration

## Platform Requirements

**Development:**
- Node.js 18.20.2+ or 20.9.0+
- pnpm 9.x or 10.x
- Cloudflare account with:
  - D1 SQLite database (database_id: 4dee9c0b-6280-4eea-b14e-ef6ef45606c1)
  - R2 storage bucket (italia-lacrosse-media)
- Local development uses `wrangler` for Cloudflare service bindings

**Production:**
- Cloudflare Workers hosting platform
- SQLite D1 database on Cloudflare
- R2 object storage on Cloudflare
- Resend email service (API key required)
- Database compatibility_date: 2025-08-15 with nodejs_compat and global_fetch_strictly_public flags

**Memory & Build:**
- Build requires max 8000MB heap (NODE_OPTIONS=--max-old-space-size=8000)
- Deprecation warnings suppressed in all builds (NODE_OPTIONS=--no-deprecation)

---

*Stack analysis: 2026-02-02*
