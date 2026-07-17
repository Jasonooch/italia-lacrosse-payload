import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// The original Projects migration (20260717_000000_add_projects) created the
// `projects*` tables but forgot the `projects_id` relationship column that
// Payload's document-locking join table (`payload_locked_documents_rels`) needs
// for the new collection. Dev-mode push added it locally, so the omission only
// surfaced in production: every `projects` update runs a lock-check query that
// selects `projects_id`, and the missing column made that query throw. This
// additive migration backfills the column and its index to match what Payload
// expects.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`projects_id\` integer REFERENCES projects(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_projects_id_idx\`;`)
  // SQLite column removal is non-trivial; keeping the nullable column is safe
  // rollback behavior.
}
