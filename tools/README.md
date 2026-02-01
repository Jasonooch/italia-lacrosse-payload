# CSV Import/Export Guide

This directory contains templates and tools for bulk data operations.

## Quick Start

1. **Navigate to any collection** in the admin panel (e.g., http://localhost:3000/admin/collections/contacts)
2. Look for **Import** and **Export** buttons in the top toolbar
3. **Export**: Click Export → Choose CSV or JSON format → File downloads
4. **Import**: Click Import → Upload CSV file → **Map fields** → Preview data → Import

## NEW: Field Mapping Feature 🎯

The extended plugin now includes **automatic field mapping**! You don't need to match column names exactly anymore.

**Import Workflow:**
1. Upload your CSV (column names can be anything)
2. **Map Step**: The UI shows your CSV columns and lets you map them to Payload fields
3. Preview your data before importing
4. Import with real-time progress tracking
5. Download error report for any failed rows

## Templates

### Contacts Import Template

See `contacts-import-template.csv` for the expected CSV structure.

**Key Points:**
- Nested fields use dot notation: `address.street`, `address.city`, etc.
- Date format: `YYYY-MM-DD` (e.g., `1998-05-15`)
- Required fields: `firstName`, `lastName`, `email`, `contactType`
- Conditional fields only required based on `contactType`:
  - `parent-email`, `parent-phone` → only for youth programs
  - `position`, `dateOfBirth` → only for players

**Select Field Values:**

`contactType`: `player`, `donor`, `coach`

`program`: `mens`, `womens`, `boys-youth`, `girls-youth`, `fundraising`, `donor`, `coaching`

`citizenship`: `citizen`, `pending`, `dnq`, `not-a-citizen`

`position`: `attack`, `midfield`, `lsm`, `defense`, `goalie`, `faceoff`

`lineage`: `italian-citizen`, `parent`, `grandfather`, `grandmother`, `great-grandfather`, `great-grandmother`, `not-sure`

## Tips

### Preparing Data for Import

1. **Export first** to see the exact format Payload expects
2. **Use the template** as a starting point
3. **Validate required fields** before importing
4. **Test with small batches** first (5-10 rows)
5. **Keep backup** of your CSV before importing

### Handling Errors

If import fails:
- Download the error CSV with line numbers
- Fix issues in your original CSV
- Re-import the corrected file

### Working with Relationships

- Relationship fields (like `sourceFormSubmission`) use document IDs
- Export existing data first to see the ID format
- For new imports, leave relationship fields empty unless you have valid IDs

## Advanced Usage

### Exporting Filtered Data

1. Apply filters in the collection list view
2. Click Export → filtered results will be exported

### Updating Existing Records

- Include the `id` column with existing document IDs
- Import will update matching records instead of creating new ones
- Be careful not to duplicate records (check `email` uniqueness)

## One-Time Import from Google Forms

If you have existing Google Form data to import:

### Transform Script

Use `transform-import.js` to convert Google Form CSV exports:

```bash
node tools/transform-import.js <input.csv> <output.csv>
```

**Example:**
```bash
node tools/transform-import.js ~/Desktop/test-import.csv ./contacts-ready-to-import.csv
```

**What it does:**
- Maps Google Form columns to Payload field names
- Transforms select values (`Men's Player` → `mens`)
- Formats dates (`4/19/1999` → `1999-04-19`)
- Handles nested fields (`address.city`, `address.state`)
- Skips rows without email addresses

Then import the output file via the admin UI.

## Need Help?

- Plugin docs: https://www.npmjs.com/package/@prototyp/payload-extended-import-export-plugin
- Payload docs: https://payloadcms.com/docs
