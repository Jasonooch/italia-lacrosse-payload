import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// Additive migration for the project Activity tab: a `comments` collection
// (staff comments with single-level reply threading via self-referential
// `parent_id`) and an `activity-log` collection (system-generated change feed).
// Statements mirror the schema Payload's dev-mode push generated locally
// (verified against the local D1 .schema dump), including the two
// `payload_locked_documents_rels` columns Payload's document-locking query
// selects for every new collection — omitting those is the exact class of bug
// that broke Projects in production (see 20260717_010000).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`comments\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`project_id\` integer NOT NULL,
    \`author_id\` integer NOT NULL,
    \`body\` text NOT NULL,
    \`parent_id\` integer,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX \`comments_project_idx\` ON \`comments\` (\`project_id\`);`)
  await db.run(sql`CREATE INDEX \`comments_author_idx\` ON \`comments\` (\`author_id\`);`)
  await db.run(sql`CREATE INDEX \`comments_parent_idx\` ON \`comments\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`comments_updated_at_idx\` ON \`comments\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`comments_created_at_idx\` ON \`comments\` (\`created_at\`);`)

  await db.run(sql`CREATE TABLE \`activity_log\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`project_id\` integer NOT NULL,
    \`actor_id\` integer,
    \`type\` text NOT NULL,
    \`summary\` text NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`actor_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX \`activity_log_project_idx\` ON \`activity_log\` (\`project_id\`);`)
  await db.run(sql`CREATE INDEX \`activity_log_actor_idx\` ON \`activity_log\` (\`actor_id\`);`)
  await db.run(sql`CREATE INDEX \`activity_log_updated_at_idx\` ON \`activity_log\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`activity_log_created_at_idx\` ON \`activity_log\` (\`created_at\`);`)

  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`comments_id\` integer REFERENCES comments(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_comments_id_idx\` ON \`payload_locked_documents_rels\` (\`comments_id\`);`,
  )
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`activity_log_id\` integer REFERENCES activity_log(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_activity_log_id_idx\` ON \`payload_locked_documents_rels\` (\`activity_log_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_activity_log_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`activity_log_id\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_comments_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`comments_id\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`activity_log\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`comments\`;`)
}
