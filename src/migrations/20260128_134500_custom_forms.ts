import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Update forms table - remove plugin columns and add formJSON
  await db.run(sql`PRAGMA foreign_keys=OFF;`)

  // Create new forms table with custom schema
  await db.run(sql`CREATE TABLE \`__new_forms\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    \`slug\` text NOT NULL,
    \`description\` text,
    \`form_json\` text NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`)

  // Copy existing data if any
  await db.run(
    sql`INSERT INTO \`__new_forms\`("id", "title", "slug", "description", "form_json", "updated_at", "created_at")
        SELECT "id", "title", "slug", "description", '{}', "updated_at", "created_at" FROM \`forms\`;`,
  )

  await db.run(sql`DROP TABLE \`forms\`;`)
  await db.run(sql`ALTER TABLE \`__new_forms\` RENAME TO \`forms\`;`)

  // Create indexes
  await db.run(sql`CREATE UNIQUE INDEX \`forms_slug_idx\` ON \`forms\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`forms_updated_at_idx\` ON \`forms\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`forms_created_at_idx\` ON \`forms\` (\`created_at\`);`)

  // Update form_submissions table - simplify structure
  await db.run(sql`CREATE TABLE \`__new_form_submissions\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`form_id\` integer NOT NULL,
    \`data\` text NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)

  // Copy submission data
  await db.run(
    sql`INSERT INTO \`__new_form_submissions\`("id", "form_id", "data", "updated_at", "created_at")
        SELECT "id", "form_id", "submission_data", "updated_at", "created_at" FROM \`form_submissions\`;`,
  )

  await db.run(sql`DROP TABLE \`form_submissions\`;`)
  await db.run(sql`ALTER TABLE \`__new_form_submissions\` RENAME TO \`form_submissions\`;`)

  // Create indexes
  await db.run(sql`CREATE INDEX \`form_submissions_form_id_idx\` ON \`form_submissions\` (\`form_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`)

  // Update payload_locked_documents_rels to work with new structure
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`forms_id\` integer REFERENCES forms(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`form_submissions_id\` integer REFERENCES form_submissions(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  )

  await db.run(sql`PRAGMA foreign_keys=ON;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)

  // Revert forms table
  await db.run(sql`CREATE TABLE \`__new_forms\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    \`slug\` text NOT NULL,
    \`description\` text,
    \`create_contact\` integer DEFAULT false,
    \`contact_type\` text DEFAULT 'player',
    \`contact_field_mapping\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`)

  await db.run(
    sql`INSERT INTO \`__new_forms\`("id", "title", "slug", "description", "create_contact", "contact_type", "contact_field_mapping", "updated_at", "created_at")
        SELECT "id", "title", "slug", "description", 0, 'player', NULL, "updated_at", "created_at" FROM \`forms\`;`,
  )

  await db.run(sql`DROP TABLE \`forms\`;`)
  await db.run(sql`ALTER TABLE \`__new_forms\` RENAME TO \`forms\`;`)

  // Revert form_submissions table
  await db.run(sql`CREATE TABLE \`__new_form_submissions\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`form_id\` integer NOT NULL,
    \`contact_id\` integer,
    \`submission_data\` text NOT NULL,
    \`status\` text DEFAULT 'pending',
    \`submitted_at\` text,
    \`ip_address\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`contact_id\`) REFERENCES \`contacts\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)

  await db.run(
    sql`INSERT INTO \`__new_form_submissions\`("id", "form_id", "contact_id", "submission_data", "status", "submitted_at", "ip_address", "updated_at", "created_at")
        SELECT "id", "form_id", NULL, "data", 'pending', NULL, NULL, "updated_at", "created_at" FROM \`form_submissions\`;`,
  )

  await db.run(sql`DROP TABLE \`form_submissions\`;`)
  await db.run(sql`ALTER TABLE \`__new_form_submissions\` RENAME TO \`form_submissions\`;`)

  // Remove payload_locked_documents_rels columns
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`forms_id\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`form_submissions_id\`;`)

  await db.run(sql`PRAGMA foreign_keys=ON;`)
}
