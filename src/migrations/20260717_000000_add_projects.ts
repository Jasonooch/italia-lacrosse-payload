import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// Additive migration for the new Projects collection. Statements mirror the
// schema Payload's dev-mode push generated locally (verified against the local
// D1 .schema dump), so the production tables match what Payload expects.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`projects\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    \`description\` text,
    \`status\` text DEFAULT 'not-started' NOT NULL,
    \`start_date\` text,
    \`due_date\` text,
    \`event_id\` integer,
    \`owner_id\` integer,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`event_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX \`projects_event_idx\` ON \`projects\` (\`event_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_owner_idx\` ON \`projects\` (\`owner_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_updated_at_idx\` ON \`projects\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`projects_created_at_idx\` ON \`projects\` (\`created_at\`);`)

  await db.run(sql`CREATE TABLE \`projects_milestones\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    \`status\` text DEFAULT 'not-started' NOT NULL,
    \`due_date\` text,
    \`assignee_id\` integer,
    FOREIGN KEY (\`assignee_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`projects_milestones_order_idx\` ON \`projects_milestones\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`projects_milestones_parent_id_idx\` ON \`projects_milestones\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_milestones_assignee_idx\` ON \`projects_milestones\` (\`assignee_id\`);`)

  await db.run(sql`CREATE TABLE \`projects_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`users_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(sql`CREATE INDEX \`projects_rels_order_idx\` ON \`projects_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`projects_rels_parent_idx\` ON \`projects_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`projects_rels_path_idx\` ON \`projects_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`projects_rels_users_id_idx\` ON \`projects_rels\` (\`users_id\`);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`projects_rels\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`projects_milestones\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`projects\`;`)
}
