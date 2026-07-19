import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// @-mentions + inbox: a `comments_rels` join table for the new hasMany
// `mentions` relationship on comments, and a `notifications` collection (one
// row per recipient per mention / new comment / project change). Statements
// mirror the schema Payload's dev-mode push generated locally, including the
// `notifications_id` column on `payload_locked_documents_rels` (Payload's
// document-lock query selects it for every new collection — see 20260717_010000
// for the production bug that omitting it caused).
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`comments_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`users_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`comments_rels_order_idx\` ON \`comments_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`comments_rels_parent_idx\` ON \`comments_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`comments_rels_path_idx\` ON \`comments_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`comments_rels_users_id_idx\` ON \`comments_rels\` (\`users_id\`);`)

  await db.run(sql`CREATE TABLE \`notifications\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`recipient_id\` integer NOT NULL,
    \`type\` text NOT NULL,
    \`project_id\` integer,
    \`actor_id\` integer,
    \`comment_id\` integer,
    \`summary\` text NOT NULL,
    \`read\` integer DEFAULT false,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`recipient_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`actor_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`comment_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX \`notifications_recipient_idx\` ON \`notifications\` (\`recipient_id\`);`)
  await db.run(sql`CREATE INDEX \`notifications_project_idx\` ON \`notifications\` (\`project_id\`);`)
  await db.run(sql`CREATE INDEX \`notifications_actor_idx\` ON \`notifications\` (\`actor_id\`);`)
  await db.run(sql`CREATE INDEX \`notifications_comment_idx\` ON \`notifications\` (\`comment_id\`);`)
  await db.run(sql`CREATE INDEX \`notifications_read_idx\` ON \`notifications\` (\`read\`);`)
  await db.run(sql`CREATE INDEX \`notifications_updated_at_idx\` ON \`notifications\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`notifications_created_at_idx\` ON \`notifications\` (\`created_at\`);`)

  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`notifications_id\` integer REFERENCES notifications(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_notifications_id_idx\` ON \`payload_locked_documents_rels\` (\`notifications_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_notifications_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`notifications_id\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`notifications\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`comments_rels\`;`)
}
