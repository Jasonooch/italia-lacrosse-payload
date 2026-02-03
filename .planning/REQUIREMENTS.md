# Requirements: CSV Import Tool

**Defined:** 2026-02-02
**Core Value:** Reliably import 1,800+ contacts from CSV without data loss or corruption

## v1 Requirements

### Schema Changes

- [x] **SCHEMA-01**: Add `involvement` textarea (donor) and `coachingExperience` textarea (coach) to Contacts collection

### CSV Parsing

- [ ] **CSV-01**: Read CSV file path from command line argument
- [ ] **CSV-02**: Parse CSV with proper handling of quoted fields and commas
- [ ] **CSV-03**: Map CSV column headers to Payload field names
- [ ] **CSV-04**: Merge duplicate columns (Date of Birth, Position, Town/State) — take first non-empty value

### Data Transformation

- [ ] **XFORM-01**: Transform "Please select your interest" into contactType and program
- [ ] **XFORM-02**: Transform lineage values ("My great-grandparent(s)..." → "great-grandfather")
- [ ] **XFORM-03**: Transform position values ("Attack" → "attack")
- [ ] **XFORM-04**: Parse date of birth strings into date format
- [ ] **XFORM-05**: Map coaching description to `coachingExperience`, involvement description to `involvement`

### Import Execution

- [ ] **IMPORT-01**: Create new contacts via Payload Local API
- [ ] **IMPORT-02**: Update existing contacts when email matches (upsert behavior)
- [ ] **IMPORT-03**: Display progress during import (X of Y processed)
- [ ] **IMPORT-04**: Continue processing on row errors (don't abort entire import)

### CLI Features

- [ ] **CLI-01**: Accept CSV file path as argument
- [ ] **CLI-02**: Support --dry-run flag to validate without writing to database

### Reporting

- [ ] **REPORT-01**: Print summary after completion (created, updated, failed counts)
- [ ] **REPORT-02**: List failed rows with error reason

## v2 Requirements

(None planned — this is a focused utility)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin UI upload | CLI is sufficient for occasional imports by technical user |
| Export functionality | Official Payload plugin works for this |
| Real-time Google Sheets sync | Batch import only |
| Data validation beyond Payload | Trust source data, let Payload validate |
| Street address / zip import | Not in source CSV |
| Parent/guardian names | Not in schema, ignored |
| Timestamp preservation | Not needed |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 1 - Schema Prep | Complete |
| CSV-01 | Phase 2 - CSV Pipeline | Pending |
| CSV-02 | Phase 2 - CSV Pipeline | Pending |
| CSV-03 | Phase 2 - CSV Pipeline | Pending |
| CSV-04 | Phase 2 - CSV Pipeline | Pending |
| XFORM-01 | Phase 2 - CSV Pipeline | Pending |
| XFORM-02 | Phase 2 - CSV Pipeline | Pending |
| XFORM-03 | Phase 2 - CSV Pipeline | Pending |
| XFORM-04 | Phase 2 - CSV Pipeline | Pending |
| XFORM-05 | Phase 2 - CSV Pipeline | Pending |
| IMPORT-01 | Phase 3 - Import and Reporting | Pending |
| IMPORT-02 | Phase 3 - Import and Reporting | Pending |
| IMPORT-03 | Phase 3 - Import and Reporting | Pending |
| IMPORT-04 | Phase 3 - Import and Reporting | Pending |
| CLI-01 | Phase 3 - Import and Reporting | Pending |
| CLI-02 | Phase 3 - Import and Reporting | Pending |
| REPORT-01 | Phase 3 - Import and Reporting | Pending |
| REPORT-02 | Phase 3 - Import and Reporting | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after Phase 1 completion*
