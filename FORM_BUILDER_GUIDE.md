# Form Builder Plugin Guide

## Installation Complete ✓

The `@payloadcms/plugin-form-builder` has been successfully installed and configured with automatic contact creation.

## What's Included

### Collections Created
- **Forms** (`/admin/collections/forms`) - Build and manage forms with a drag-and-drop interface
- **Form Submissions** (`/admin/collections/form-submissions`) - View all form submissions

### Custom Features Added
- **Automatic Contact Creation** - Forms can automatically create contacts from submissions
- **Contact Field Mapping** - Map form fields to contact fields
- **Contact Type Selection** - Set the default contact type (Player, Donor, Coach)

## Creating an Interest Form

1. **Go to Admin Panel**
   ```
   http://localhost:3000/admin/collections/forms
   ```

2. **Create New Form**
   - Click "Create New"
   - Enter form title (e.g., "Player Interest Form")
   - Add form fields using the drag-and-drop builder

3. **Available Field Types**
   - Text
   - Email
   - Textarea
   - Number
   - Select (dropdown)
   - Checkbox
   - Message (informational text)
   - Country (dropdown of countries)
   - State (US states dropdown)

4. **Configure Contact Creation** (Sidebar)
   - Enable "Create Contact" checkbox
   - Select "Contact Type" (Player/Donor/Coach)
   - Add "Contact Field Mapping" (JSON):
     ```json
     {
       "firstName": "firstName",
       "lastName": "lastName",
       "email": "email",
       "phoneNumber": "phone",
       "dateOfBirth": "dateOfBirth",
       "highSchool": "highSchool",
       "college": "college"
     }
     ```
     The keys are your form field names, values are the contact collection field names.

5. **Confirmation Settings**
   - Set confirmation type: "message" or "redirect"
   - Add confirmation message or redirect URL
   - Customize submit button label

6. **Email Notifications** (Optional)
   - Add email recipients to be notified on submission
   - Customize email subject and message

## Field Mapping Reference

### Contact Collection Fields
Map your form fields to these contact fields:
- `firstName` (required)
- `lastName` (required)
- `email` (required)
- `phone`
- `contactType` (player/donor/coach - set automatically from form config)
- `program`
- `position`
- `dateOfBirth`
- `highSchool`
- `college`
- `professionalExperience`
- `highlightTape`
- `playerStatus`
- `graduationYear`
- `currentLocation`
- `lineage`
- `citizenship`
- `notes`
- Address fields: `address.street`, `address.city`, `address.state`, `address.zip`, `address.country`

### Example Interest Form Setup

**Form Fields:**
1. First Name (text, required)
2. Last Name (text, required)
3. Email (email, required)
4. Phone Number (text)
5. Date of Birth (text with date format)
6. Current High School (text)
7. College (text)
8. Position (select: Attack, Midfield, Defense, Goalie)
9. Highlight Video URL (text)
10. Additional Information (textarea)

**Contact Field Mapping:**
```json
{
  "firstName": "firstName",
  "lastName": "lastName",
  "email": "email",
  "phoneNumber": "phone",
  "dateOfBirth": "dateOfBirth",
  "currentHighSchool": "highSchool",
  "college": "college",
  "position": "position",
  "highlightVideoUrl": "highlightTape",
  "additionalInformation": "notes"
}
```

## How It Works

1. User fills out and submits the form on your website
2. Form submission is created in `form-submissions` collection
3. If "Create Contact" is enabled:
   - The `createContactFromSubmission` hook runs automatically
   - It reads the form's contact field mapping
   - It creates a new contact with mapped data
   - The submission is linked to the created contact
4. You can view submissions and contacts in the admin panel

## Database Migration

A new migration has been created: `20260127_202600_recreate_forms_for_plugin.ts`

**To apply the migration:**

### Local Development
```bash
# The migration runs automatically on dev server start
pnpm dev
```

### Production (Cloudflare)
```bash
# Deploy database migration
pnpm deploy:database

# Then deploy the app
pnpm deploy
```

**⚠️ Important:** This migration **deletes all existing form and form submission data** because the table schema changed significantly. Since you confirmed this was test data, it's safe to proceed.

## Next Steps

1. Start the dev server: `pnpm dev`
2. Create your first form in the admin panel
3. Test the form by submitting it
4. Check that contacts are created automatically (if enabled)
5. Deploy when ready

## Troubleshooting

### Form submissions not creating contacts
- Check that "Create Contact" is enabled on the form
- Verify the field mapping JSON is valid
- Ensure required fields (firstName, lastName, email) are mapped
- Check server logs for errors

### Migration issues
If you get migration errors on deployment:
- The local database and remote database are out of sync
- Run `pnpm deploy:database` to apply migrations to Cloudflare D1
- If that fails, you may need to reset the remote database (loses all data)

## Documentation

- [Payload Form Builder Plugin](https://payloadcms.com/docs/plugins/form-builder)
- [Payload Hooks](https://payloadcms.com/docs/hooks/overview)
- [Your project docs](./CLAUDE.md)
