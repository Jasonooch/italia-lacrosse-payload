import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`contacts_tags\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tag\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`contacts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`contacts_tags_order_idx\` ON \`contacts_tags\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`contacts_tags_parent_id_idx\` ON \`contacts_tags\` (\`_parent_id\`);`)
  await db.run(sql`CREATE TABLE \`contacts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`first_name\` text NOT NULL,
  	\`last_name\` text NOT NULL,
  	\`email\` text NOT NULL,
  	\`phone\` text,
  	\`contact_type\` text DEFAULT 'player' NOT NULL,
  	\`program\` text,
  	\`position\` text,
  	\`date_of_birth\` text,
  	\`high_school\` text,
  	\`college\` text,
  	\`professional_experience\` text,
  	\`highlight_tape\` text,
  	\`player_status\` text,
  	\`education\` text,
  	\`graduation_year\` numeric,
  	\`current_location\` text,
  	\`lineage\` text,
  	\`citizenship\` text,
  	\`address_street\` text,
  	\`address_city\` text,
  	\`address_state\` text,
  	\`address_zip\` text,
  	\`address_country\` text DEFAULT 'USA',
  	\`notes\` text,
  	\`internal_notes\` text,
  	\`source\` text DEFAULT 'manual' NOT NULL,
  	\`source_form_submission_id\` integer,
  	\`last_contacted_at\` text,
  	\`created_by_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`source_form_submission_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`contacts_email_idx\` ON \`contacts\` (\`email\`);`)
  await db.run(sql`CREATE INDEX \`contacts_source_form_submission_idx\` ON \`contacts\` (\`source_form_submission_id\`);`)
  await db.run(sql`CREATE INDEX \`contacts_created_by_idx\` ON \`contacts\` (\`created_by_id\`);`)
  await db.run(sql`CREATE INDEX \`contacts_updated_at_idx\` ON \`contacts\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`contacts_created_at_idx\` ON \`contacts\` (\`created_at\`);`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
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
  );
  `)
  await db.run(sql`INSERT INTO \`__new_form_submissions\`("id", "form_id", "contact_id", "submission_data", "status", "submitted_at", "ip_address", "updated_at", "created_at") SELECT "id", "form_id", "contact_id", "submission_data", "status", "submitted_at", "ip_address", "updated_at", "created_at" FROM \`form_submissions\`;`)
  await db.run(sql`DROP TABLE \`form_submissions\`;`)
  await db.run(sql`ALTER TABLE \`__new_form_submissions\` RENAME TO \`form_submissions\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`form_submissions_form_idx\` ON \`form_submissions\` (\`form_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_contact_idx\` ON \`form_submissions\` (\`contact_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`forms\` ADD \`create_contact\` integer DEFAULT false;`)
  await db.run(sql`ALTER TABLE \`forms\` ADD \`contact_type\` text DEFAULT 'player';`)
  await db.run(sql`ALTER TABLE \`forms\` ADD \`contact_field_mapping\` text;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`contacts_id\` integer REFERENCES contacts(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_contacts_id_idx\` ON \`payload_locked_documents_rels\` (\`contacts_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`contacts_tags\`;`)
  await db.run(sql`DROP TABLE \`contacts\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
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
  	FOREIGN KEY (\`contact_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_form_submissions\`("id", "form_id", "contact_id", "submission_data", "status", "submitted_at", "ip_address", "updated_at", "created_at") SELECT "id", "form_id", "contact_id", "submission_data", "status", "submitted_at", "ip_address", "updated_at", "created_at" FROM \`form_submissions\`;`)
  await db.run(sql`DROP TABLE \`form_submissions\`;`)
  await db.run(sql`ALTER TABLE \`__new_form_submissions\` RENAME TO \`form_submissions\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`form_submissions_form_idx\` ON \`form_submissions\` (\`form_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_contact_idx\` ON \`form_submissions\` (\`contact_id\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`)
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
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`payload_folders_id\`) REFERENCES \`payload_folders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "posts_id", "categories_id", "events_id", "teams_id", "players_id", "coaches_id", "forms_id", "form_submissions_id", "users_id", "media_id", "payload_folders_id") SELECT "id", "order", "parent_id", "path", "posts_id", "categories_id", "events_id", "teams_id", "players_id", "coaches_id", "forms_id", "form_submissions_id", "users_id", "media_id", "payload_folders_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
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
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_payload_folders_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_folders_id\`);`)
  await db.run(sql`ALTER TABLE \`forms\` DROP COLUMN \`create_contact\`;`)
  await db.run(sql`ALTER TABLE \`forms\` DROP COLUMN \`contact_type\`;`)
  await db.run(sql`ALTER TABLE \`forms\` DROP COLUMN \`contact_field_mapping\`;`)
}
