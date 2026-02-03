# CSV Import Tool for Italia Lacrosse

## What This Is

A CLI tool to import contacts from CSV files (exported from Google Sheets) into the Payload CMS Contacts collection. Built for occasional batch imports when transferring data from spreadsheets to the CMS database.

## Core Value

**Reliably import 1,800+ contacts from CSV without data loss or corruption.** Every row must either import successfully or report a clear error — no silent failures.

## Requirements

### Validated

- ✓ Contacts collection with full schema (names, email, phone, address, player details, etc.) — existing
- ✓ Payload CMS with Local API access — existing
- ✓ D1 SQLite database with Contacts table — existing
- ✓ `involvement` textarea on Contacts (visible when contactType = donor) — Phase 1
- ✓ `coachingExperience` textarea on Contacts (visible when contactType = coach) — Phase 1

### Active

- [ ] CLI script reads CSV file and creates Contacts via Payload Local API
- [ ] Maps Google Sheet columns to Payload field names
- [ ] Transforms select field values (e.g., "Men's" → "mens", "Attack" → "attack")
- [ ] Handles nested address fields (street, city, state, zip, country)
- [ ] Reports progress during import (X of Y imported)
- [ ] Handles duplicate emails gracefully (email is unique constraint)
- [ ] Produces summary report (success count, error count, failed rows)

### Out of Scope

- Admin UI upload interface — CLI is sufficient for occasional imports by technical user
- Export functionality — official Payload plugin works for this
- Real-time sync with Google Sheets — this is batch import only
- Validation of data quality (e.g., email format) — trust source data, let Payload validate

## Context

**Existing codebase:** Payload CMS 3.73.0 + Next.js 15 deployed on Cloudflare Workers with D1 database.

**Contacts collection schema** (src/collections/Contacts.ts):
- Basic info: firstName, lastName, email (unique), phone, dateOfBirth, lineage
- Donor/Coach: involvement (donor only), coachingExperience (coach only)
- Classification: contactType (player/donor/coach), program, citizenship
- Player details: position, highSchool, college, graduationYear, professionalExperience, highlightTape
- Address: nested group with street, city, state, zip, country

**Source data:** Google Sheet with 1,800 contacts. Columns: Program, First Name, Last name, email address, phone number, date of birth, lineage, citizenship, position, high school, college, graduation year, professional experience, highlight tape link, street, city, state, zip, country.

**Previous attempts:** Third-party CSV import plugins did not work properly. Fresh approach needed.

## Constraints

- **Runtime**: Must work with Payload Local API (not REST) for performance and to avoid rate limits
- **Database**: D1 SQLite via @payloadcms/db-d1-sqlite — standard Payload operations
- **Unique constraint**: Email field is unique — duplicates must be handled (skip or update)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI script over admin UI | User is technical, occasional use, faster to build | — Pending |
| Payload Local API over REST | Better performance for bulk operations, no auth overhead | — Pending |

---
*Last updated: 2026-02-02 after Phase 1 (schema: involvement + coachingExperience fields shipped)*
