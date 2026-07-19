import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// Adds the staff-only `project-files` upload collection and the `resources`
// array on Projects. Statements mirror the schema Payload's dev-mode push
// generated locally (verified against the local D1 .schema dump), so the
// production tables match what Payload expects.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`project_files\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`url\` text,
    \`thumbnail_u_r_l\` text,
    \`filename\` text,
    \`mime_type\` text,
    \`filesize\` numeric,
    \`width\` numeric,
    \`height\` numeric,
    \`focal_x\` numeric,
    \`focal_y\` numeric
  );`)
  await db.run(sql`CREATE INDEX \`project_files_updated_at_idx\` ON \`project_files\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`project_files_created_at_idx\` ON \`project_files\` (\`created_at\`);`)
  await db.run(
    sql`CREATE UNIQUE INDEX \`project_files_filename_idx\` ON \`project_files\` (\`filename\`);`,
  )

  await db.run(sql`CREATE TABLE \`projects_resources\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    \`url\` text,
    \`file_id\` integer,
    FOREIGN KEY (\`file_id\`) REFERENCES \`project_files\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`projects_resources_order_idx\` ON \`projects_resources\` (\`_order\`);`)
  await db.run(
    sql`CREATE INDEX \`projects_resources_parent_id_idx\` ON \`projects_resources\` (\`_parent_id\`);`,
  )
  await db.run(sql`CREATE INDEX \`projects_resources_file_idx\` ON \`projects_resources\` (\`file_id\`);`)

  // Document-locking join table needs a column per collection (see
  // 20260717_010000_add_projects_locked_docs_rel for the earlier omission).
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`project_files_id\` integer REFERENCES project_files(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_project_files_id_idx\` ON \`payload_locked_documents_rels\` (\`project_files_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_project_files_id_idx\`;`)
  // SQLite column removal is non-trivial; keeping the nullable column is safe
  // rollback behavior.
  await db.run(sql`DROP TABLE IF EXISTS \`projects_resources\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`project_files\`;`)
}
