# Roadmap: CSV Import Tool

## Overview

A three-phase CLI utility that transforms a Google Sheets CSV export into Payload CMS Contacts records. Phase 1 prepares the schema, Phase 2 builds and validates the CSV-to-record pipeline, and Phase 3 assembles the runnable CLI with upsert logic and reporting.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Schema Prep** - Add involvement and coachingExperience fields to Contacts collection ✓
- [ ] **Phase 2: CSV Pipeline** - Parse CSV and transform raw values into Payload-ready records
- [ ] **Phase 3: Import and Reporting** - Assemble CLI, execute upsert import, and report results

## Phase Details

### Phase 1: Schema Prep ✓ COMPLETE
**Goal**: The Contacts collection schema supports every field the import will populate, so no row fails due to a missing field.
**Depends on**: Nothing (first phase)
**Requirements**: [SCHEMA-01]
**Success Criteria** (what must be TRUE):
  1. ✓ `involvement` textarea (visible when contactType = donor) exists on Contacts
  2. ✓ `coachingExperience` textarea (visible when contactType = coach) exists on Contacts
  3. ✓ Migration created (20260202_add_contacts_involvement_fields) and types regenerated

Plans:
- [x] 01-01: Add involvement and coachingExperience fields to Contacts collection and generate migration

### Phase 2: CSV Pipeline
**Goal**: The import pipeline correctly reads a CSV file and transforms every raw value into a valid Payload record shape, verifiable via dry-run output before any data hits the database.
**Depends on**: Phase 1
**Requirements**: [CSV-01, CSV-02, CSV-03, CSV-04, XFORM-01, XFORM-02, XFORM-03, XFORM-04, XFORM-05]
**Success Criteria** (what must be TRUE):
  1. The script reads a CSV file from a command-line path argument and parses all rows correctly, including fields that contain commas or quotes
  2. CSV column headers are mapped to the correct Payload field names for every field in the Contacts schema
  3. Duplicate columns (Date of Birth, Position, Town/State) are merged using the first non-empty value — no data is silently dropped
  4. Select fields are transformed to valid enum values: contactType and program from the interest column, lineage from free-text to canonical values, position from display names to lowercase identifiers
  5. Date of birth strings are parsed into valid date format; coaching description maps to `coachingExperience`, involvement description maps to `involvement`
**Plans**: TBD

Plans:
- [ ] 02-01: Implement CSV file reading, parsing, and column-to-field mapping
- [ ] 02-02: Implement all data transformations (select fields, dates, duplicate merge, involvement/coachingExperience)

### Phase 3: Import and Reporting
**Goal**: The CLI tool runs end-to-end — reading, transforming, importing, and reporting — with resilient error handling and dry-run validation.
**Depends on**: Phase 2
**Requirements**: [IMPORT-01, IMPORT-02, IMPORT-03, IMPORT-04, CLI-01, CLI-02, REPORT-01, REPORT-02]
**Success Criteria** (what must be TRUE):
  1. Running the script with a valid CSV path creates new Contact records in the database via Payload Local API
  2. Running the script against a CSV containing an email that already exists in the database updates that record rather than erroring or duplicating
  3. A single row error (e.g. invalid data) does not abort the import — remaining rows continue processing
  4. Progress output is printed during execution showing how many rows have been processed out of the total
  5. After completion, a summary report prints created count, updated count, and failed count, followed by a list of each failed row with the specific error reason
  6. The --dry-run flag causes the script to parse and transform all rows and print results without writing anything to the database
**Plans**: TBD

Plans:
- [ ] 03-01: Implement import execution (create/upsert via Local API, progress display, error resilience)
- [ ] 03-02: Implement CLI interface (file path arg, --dry-run flag) and summary reporting

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema Prep | 1/1 | ✓ Complete | 2026-02-02 |
| 2. CSV Pipeline | 0/2 | Not started | - |
| 3. Import and Reporting | 0/2 | Not started | - |
