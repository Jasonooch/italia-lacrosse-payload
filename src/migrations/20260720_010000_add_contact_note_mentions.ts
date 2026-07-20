import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// @-mentions on contact notes: a `contact_notes_rels` join table for the new
// hasMany `mentions` relationship on contact-notes, plus `contact_id` and
// `contact_note_id` columns on `notifications` so mention notifications can
// point back at a contact instead of only a project. Statements mirror
// 20260719_020000 (the equivalent migration for project comment mentions).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`contact_notes_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`users_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`contact_notes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`contact_notes_rels_order_idx\` ON \`contact_notes_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`contact_notes_rels_parent_idx\` ON \`contact_notes_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`contact_notes_rels_path_idx\` ON \`contact_notes_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`contact_notes_rels_users_id_idx\` ON \`contact_notes_rels\` (\`users_id\`);`)

  await db.run(
    sql`ALTER TABLE \`notifications\` ADD COLUMN \`contact_id\` integer REFERENCES contacts(id);`,
  )
  await db.run(sql`CREATE INDEX \`notifications_contact_idx\` ON \`notifications\` (\`contact_id\`);`)
  await db.run(
    sql`ALTER TABLE \`notifications\` ADD COLUMN \`contact_note_id\` integer REFERENCES contact_notes(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`notifications_contact_note_idx\` ON \`notifications\` (\`contact_note_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`notifications_contact_note_idx\`;`)
  await db.run(sql`ALTER TABLE \`notifications\` DROP COLUMN \`contact_note_id\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`notifications_contact_idx\`;`)
  await db.run(sql`ALTER TABLE \`notifications\` DROP COLUMN \`contact_id\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`contact_notes_rels\`;`)
}
