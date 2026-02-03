# Coding Conventions

**Analysis Date:** 2026-02-02

## Naming Patterns

**Files:**
- Collections: PascalCase singular (`Users.ts`, `Coaches.ts`, `Posts.ts`)
- Access functions: camelCase (`authenticated.ts`, `adminOnly.ts`)
- Utilities and hooks: camelCase with descriptive names (`autoOrganizeMedia.ts`, `slug.ts`)
- Migration files: ISO timestamp prefix with snake_case description (`20260120_010519.ts`, `20260127_202600_recreate_forms_for_plugin.ts`)
- React components: PascalCase (`Logo.tsx`, `Icon.tsx`)
- API routes: lowercase with segments or brackets (`[[...segments]]`, `[...slug]`)
- Directories: kebab-case (`api`, `form-builder`, `form-submissions`)

**Functions:**
- Named exports use camelCase (`const authenticated`, `const slugField`, `const autoOrganizeMedia`)
- Arrow functions preferred over function declarations
- Exported utility functions typically wrap configuration objects and return higher-order functions

**Variables:**
- Local variables: camelCase (`payload`, `folderName`, `mediaId`, `existingFolders`)
- Constants: camelCase (not UPPER_SNAKE_CASE) (`isCLI`, `isProduction`, `isBuild`)
- Booleans: prefixed with `is` or similar (`isActive`, `isPublic`, `isProduction`)
- Private/internal: single underscore prefix (`_payload`, `_request`)

**Types:**
- Collection types: singular PascalCase (`User`, `Post`, `Coach`)
- Type imports: `import type { ... }` (strict separation)
- Interface definitions: PascalCase (`CollectionConfig`, `Access`)
- Union types: Capitalized descriptive names
- Field type strings: lowercase (`'text'`, `'select'`, `'richText'`, `'upload'`)

## Code Style

**Formatting:**
- Tool: Prettier
- Single quotes: `true`
- Trailing comma: `'all'` (all parameters/array elements)
- Print width: 100 characters
- Semicolons: `false` (omitted)
- No semicolons at end of statements or declarations

**Linting:**
- Tool: ESLint with Next.js configuration (`eslint-config-next`)
- Config: `eslint.config.mjs` (flat config format)
- Key rules enforced:
  - `@typescript-eslint/ban-ts-comment`: `'warn'`
  - `@typescript-eslint/no-empty-object-type`: `'warn'`
  - `@typescript-eslint/no-explicit-any`: `'warn'`
  - `@typescript-eslint/no-unused-vars`: `'warn'` with pattern matching
    - Args pattern: `args: 'after-used'` (ignore params after used param)
    - Var pattern: Ignore variables starting with `_`
    - Destructure pattern: `^_`
    - Error pattern: `^(_|ignore)`

**Ignored patterns:**
- `.next/` directory (build output)

## Import Organization

**Order:**
1. Node.js built-in modules (`path`, `fs`)
2. Third-party packages (`react`, `payload`, `@payloadcms/*`)
3. Internal absolute imports using `@/` alias
4. Relative imports (less common)
5. Type imports separated with `import type { ... }`

**Example pattern:**
```typescript
import fs from 'fs'
import path from 'path'
import type { CollectionConfig } from 'payload'
import { buildConfig } from 'payload'
import { slugField } from '../fields/slug'
import { authenticated } from '../access/authenticated'
import { adminOnly } from '@/access'
```

**Path Aliases:**
- `@/*` → `./src/*` (project root alias)
- `@payload-config` → `./src/payload.config.ts` (specific config alias)

## Error Handling

**Patterns:**
- Try-catch with logging: Errors logged via `req.payload.logger` with context
- Graceful degradation: Operations catch errors, log warnings, return partial results or `doc` unchanged
- Transaction safety: Errors in hooks don't block parent save; side effects wrapped in try-catch
- Context preservation: Errors logged with descriptive messages including failed operation and variable values

**Example from `autoOrganizeMedia.ts`:**
```typescript
try {
  // Operation
  const folderId = existingFolders.docs[0].id
} catch (folderError) {
  req.payload.logger.warn(
    `Could not find/create folder "${folderName}". Error: ${folderError}`
  )
  return doc
}
```

## Logging

**Framework:** Payload's built-in logger (`req.payload.logger`)

**Patterns:**
- Info level: Successful operations (`logger.info(...)`)
- Warn level: Recoverable issues or expected edge cases (`logger.warn(...)`)
- Error level: Unexpected failures affecting functionality (`logger.error(...)`)
- Messages: Include context variable values for debugging
- Timing: Log at operation boundaries (start/end)

**Example:**
```typescript
req.payload.logger.info(`Created folder "${folderName}" for media organization`)
req.payload.logger.warn(`Could not find/create folder...`)
req.payload.logger.error(`Failed to organize media into folder...`)
```

## Comments

**When to Comment:**
- Complex business logic requiring explanation
- Payload-specific patterns (e.g., folder management workarounds)
- Migration notes explaining why SQL changes were needed
- Hook lifecycle steps (beforeValidate, beforeChange, afterChange)
- Non-obvious conditional logic

**JSDoc/TSDoc:**
- Used for exported utility functions with public APIs
- Includes: Purpose, parameter descriptions, return type
- Example from `autoOrganizeMedia.ts`:
```typescript
/**
 * Auto-organize media into folders when uploaded through a collection.
 *
 * This hook automatically moves uploaded media files into a specified folder
 * in the Media collection. It's designed to be reusable across multiple collections.
 *
 * @param folderName - The name of the folder to organize media into
 * @param fieldName - The field name containing the media upload
 * @returns A CollectionAfterChangeHook function
 *
 * Usage:
 * ```ts
 * hooks: {
 *   afterChange: [autoOrganizeMedia('Country Flags', 'flag')]
 * }
 * ```
 */
```
- Payload-generated types: Auto-comment with TSDoc explaining field purpose

## Function Design

**Size:** Utility functions are typically 10-50 lines. Hooks/migrations can be longer (100+ lines) if logically grouped.

**Parameters:**
- Payload hooks receive destructured params: `{ doc, req, operation }`, `{ db, payload, req }`
- Collection factories take configuration: `(fieldToUse = 'title')`
- Access functions receive context: `({ req: { user } })`

**Return Values:**
- Hooks return modified document or void
- Field factories return array of Field objects: `Field[]`
- Migrations return void (they execute side effects via `db.run()`)
- Access functions return boolean

## Module Design

**Exports:**
- Named exports for reusable functions (`export const authenticated`, `export const slugField`)
- Default exports for collection configs (`export default buildConfig({...})`)
- Payload collections: export as named const (`export const Posts: CollectionConfig = {...}`)
- Access functions: exported as arrow function const, not function declarations

**Barrel Files:**
- Used in `src/access/index.ts`: centralizes and re-exports all access control functions
- Pattern: `export { functionName } from './file'`
- Allows: `import { adminOnly } from '@/access'` instead of full paths

**Example from `src/access/index.ts`:**
```typescript
export { adminOnly } from './adminOnly'
export { anyone } from './anyone'
export { authenticated } from './authenticated'
export { authenticatedOrPublished } from './authenticatedOrPublished'
```

---

*Convention analysis: 2026-02-02*
