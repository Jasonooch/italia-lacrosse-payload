import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// Additive migration for the Contacts detail page: a `contact-notes`
// collection (flat, timestamped staff notes on a contact — no threading).
// Statements mirror the shape of `comments` (20260719_010000), minus the
// self-referential `parent` column, including the
// `payload_locked_documents_rels` column Payload's document-locking query
// selects for every new collection.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`contact_notes\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`contact_id\` integer NOT NULL,
    \`author_id\` integer NOT NULL,
    \`body\` text NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`contact_id\`) REFERENCES \`contacts\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX \`contact_notes_contact_idx\` ON \`contact_notes\` (\`contact_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_notes_author_idx\` ON \`contact_notes\` (\`author_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_notes_updated_at_idx\` ON \`contact_notes\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`contact_notes_created_at_idx\` ON \`contact_notes\` (\`created_at\`);`)

  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`contact_notes_id\` integer REFERENCES contact_notes(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_contact_notes_id_idx\` ON \`payload_locked_documents_rels\` (\`contact_notes_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_contact_notes_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`contact_notes_id\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`contact_notes\`;`)
}
