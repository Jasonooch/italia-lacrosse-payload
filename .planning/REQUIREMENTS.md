# Requirements: CSV Import Tool

**Defined:** 2026-02-02
**Core Value:** Reliably import 1,800+ contacts from CSV without data loss or corruption

## v1 Requirements

### Schema Changes

- [ ] **SCHEMA-01**: Add `background` textarea field to Contacts collection for coach/donor descriptions

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
- [ ] **XFORM-05**: Combine coaching/involvement descriptions into background field

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
| SCHEMA-01 | Phase 1 | Pending |
| CSV-01 | Phase 2 | Pending |
| CSV-02 | Phase 2 | Pending |
| CSV-03 | Phase 2 | Pending |
| CSV-04 | Phase 2 | Pending |
| XFORM-01 | Phase 2 | Pending |
| XFORM-02 | Phase 2 | Pending |
| XFORM-03 | Phase 2 | Pending |
| XFORM-04 | Phase 2 | Pending |
| XFORM-05 | Phase 2 | Pending |
| IMPORT-01 | Phase 3 | Pending |
| IMPORT-02 | Phase 3 | Pending |
| IMPORT-03 | Phase 3 | Pending |
| IMPORT-04 | Phase 3 | Pending |
| CLI-01 | Phase 3 | Pending |
| CLI-02 | Phase 3 | Pending |
| REPORT-01 | Phase 3 | Pending |
| REPORT-02 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-02*
*Last updated: 2026-02-02 after initial definition*
