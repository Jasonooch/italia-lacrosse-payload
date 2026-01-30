import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

/**
 * Migration: Recreate forms tables for form builder plugin
 *
 * This migration drops the old custom forms/form_submissions tables
 * and creates new ones compatible with the @payloadcms/plugin-form-builder.
 *
 * WARNING: This will delete all existing form and form submission data.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Drop old tables
  await db.run(sql`DROP TABLE IF EXISTS \`form_submissions\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`forms\`;`)

  // Create new forms table with form builder plugin schema
  await db.run(sql`CREATE TABLE \`forms\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`submit_button_label\` text,
  	\`confirmationType\` text DEFAULT 'message',
  	\`confirmation_message\` text,
  	\`redirect_url\` text,
  	\`create_contact\` integer DEFAULT false,
  	\`contact_type\` text DEFAULT 'player',
  	\`contact_field_mapping\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `)
  await db.run(sql`CREATE INDEX \`forms_updated_at_idx\` ON \`forms\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`forms_created_at_idx\` ON \`forms\` (\`created_at\`);`)

  // Create forms_fields table (for form builder blocks)
  await db.run(sql`CREATE TABLE \`forms_fields\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`label\` text,
  	\`width\` numeric,
  	\`required\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`forms_fields_order_idx\` ON \`forms_fields\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`forms_fields_parent_id_idx\` ON \`forms_fields\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`forms_fields_path_idx\` ON \`forms_fields\` (\`_path\`);`)

  // Create forms_emails table (for email notifications)
  await db.run(sql`CREATE TABLE \`forms_emails\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`email_to\` text,
  	\`email_from\` text,
  	\`subject\` text DEFAULT 'Form Submission',
  	\`message\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`forms_emails_order_idx\` ON \`forms_emails\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`forms_emails_parent_id_idx\` ON \`forms_emails\` (\`_parent_id\`);`)

  // Create form_submissions table
  await db.run(sql`CREATE TABLE \`form_submissions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`form_id\` integer,
  	\`contact_id\` integer,
  	\`submission_data\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`form_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`contact_id\`) REFERENCES \`contacts\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`form_submissions_form_idx\` ON \`form_submissions\` (\`form_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_contact_idx\` ON \`form_submissions\` (\`contact_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`)

  // Update payload_locked_documents_rels to handle new forms structure
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`posts_id\` integer,
  	\`categories_id\` integer,
  	\`events_id\` integer,
  	\`teams_id\` integer,
  	\`players_id\` integer,
  	\`coaches_id\` integer,
  	\`forms_id\` integer,
  	\`form_submissions_id\` integer,
  	\`contacts_id\` integer,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`payload_folders_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`events_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`teams_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`players_id\`) REFERENCES \`players\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`coaches_id\`) REFERENCES \`coaches\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`forms_id\`) REFERENCES \`forms\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`contacts_id\`) REFERENCES \`contacts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_folders_id\`) REFERENCES \`payload_folders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "posts_id", "categories_id", "events_id", "teams_id", "players_id", "coaches_id", "forms_id", "form_submissions_id", "contacts_id", "users_id", "media_id", "payload_folders_id") SELECT "id", "order", "parent_id", "path", "posts_id", "categories_id", "events_id", "teams_id", "players_id", "coaches_id", "forms_id", "form_submissions_id", "contacts_id", "users_id", "media_id", "payload_folders_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_teams_id_idx\` ON \`payload_locked_documents_rels\` (\`teams_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_players_id_idx\` ON \`payload_locked_documents_rels\` (\`players_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_coaches_id_idx\` ON \`payload_locked_documents_rels\` (\`coaches_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_forms_id_idx\` ON \`payload_locked_documents_rels\` (\`forms_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_contacts_id_idx\` ON \`payload_locked_documents_rels\` (\`contacts_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_payload_folders_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_folders_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Drop form builder plugin tables
  await db.run(sql`DROP TABLE IF EXISTS \`form_submissions\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`forms_emails\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`forms_fields\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`forms\`;`)

  // Recreate old forms table structure
  await db.run(sql`CREATE TABLE \`forms\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`description\` text,
  	\`fields\` text DEFAULT '[]' NOT NULL,
  	\`is_active\` integer DEFAULT true,
  	\`is_public\` integer DEFAULT true,
  	\`create_contact\` integer DEFAULT false,
  	\`contact_type\` text DEFAULT 'player',
  	\`contact_field_mapping\` text,
  	\`created_by_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`forms_slug_idx\` ON \`forms\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`forms_created_by_idx\` ON \`forms\` (\`created_by_id\`);`)
  await db.run(sql`CREATE INDEX \`forms_updated_at_idx\` ON \`forms\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`forms_created_at_idx\` ON \`forms\` (\`created_at\`);`)

  await db.run(sql`CREATE TABLE \`form_submissions\` (
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
  );
  `)
  await db.run(sql`CREATE INDEX \`form_submissions_form_idx\` ON \`form_submissions\` (\`form_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_contact_idx\` ON \`form_submissions\` (\`contact_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`)
}
