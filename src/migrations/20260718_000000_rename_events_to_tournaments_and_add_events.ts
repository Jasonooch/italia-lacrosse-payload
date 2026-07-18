import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

// Renames the old `events` collection (which was always tournament data —
// required team, championship-tier eventType, coaching staff) to
// `tournaments`, and creates a new `events` collection for the shared staff
// calendar (meetings, tryouts, training camps). Both changes ship in one
// migration so there's never an intermediate state where
// payload_locked_documents_rels is missing a column Payload's code expects
// (see commit 300f55a for that exact class of bug).
//
// Verified against a copy of the local D1 file before writing this file:
// SQLite's ALTER TABLE RENAME TO does NOT rewrite FK-referencing text in
// other tables when `legacy_alter_table` is on (the default here), so
// `projects.tournament_id` and `payload_locked_documents_rels.tournaments_id`
// keep a literal `REFERENCES events(id)` in their FK clause after rename.
// Confirmed this is cosmetic only, not a runtime risk: `PRAGMA foreign_keys`
// defaults to 0 and nothing in @payloadcms/db-d1-sqlite ever turns it on, so
// FK cascade/set-null clauses are never enforced by SQLite itself — Payload
// manages related-doc cleanup at the application layer. The one exception is
// `tournaments_coaching_staff`, small enough to fully recreate with correct
// FK text for cleanliness, matching what a fresh dev-mode push would output.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Rename the tournaments table itself.
  await db.run(sql`ALTER TABLE \`events\` RENAME TO \`tournaments\`;`)

  // 2. Recreate the small coaching-staff child table with correct FK text.
  await db.run(sql`CREATE TABLE \`tournaments_coaching_staff\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`coach_id\` integer NOT NULL,
    \`role\` text NOT NULL,
    FOREIGN KEY (\`coach_id\`) REFERENCES \`coaches\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`tournaments\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`INSERT INTO \`tournaments_coaching_staff\` SELECT * FROM \`events_coaching_staff\`;`,
  )
  await db.run(sql`DROP TABLE \`events_coaching_staff\`;`)
  await db.run(
    sql`CREATE INDEX \`tournaments_coaching_staff_order_idx\` ON \`tournaments_coaching_staff\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`tournaments_coaching_staff_parent_id_idx\` ON \`tournaments_coaching_staff\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`tournaments_coaching_staff_coach_idx\` ON \`tournaments_coaching_staff\` (\`coach_id\`);`,
  )

  // 3. Rename tournaments' own indexes to match.
  await db.run(sql`DROP INDEX \`events_team_idx\`;`)
  await db.run(sql`DROP INDEX \`events_slug_idx\`;`)
  await db.run(sql`DROP INDEX \`events_logo_idx\`;`)
  await db.run(sql`DROP INDEX \`events_updated_at_idx\`;`)
  await db.run(sql`DROP INDEX \`events_created_at_idx\`;`)
  await db.run(sql`CREATE INDEX \`tournaments_team_idx\` ON \`tournaments\` (\`team_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`tournaments_slug_idx\` ON \`tournaments\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`tournaments_logo_idx\` ON \`tournaments\` (\`logo_id\`);`)
  await db.run(
    sql`CREATE INDEX \`tournaments_updated_at_idx\` ON \`tournaments\` (\`updated_at\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`tournaments_created_at_idx\` ON \`tournaments\` (\`created_at\`);`,
  )

  // 4. Rename the Projects FK column (FK text stays stale/cosmetic, see header comment).
  await db.run(sql`ALTER TABLE \`projects\` RENAME COLUMN \`event_id\` TO \`tournament_id\`;`)
  await db.run(sql`DROP INDEX \`projects_event_idx\`;`)
  await db.run(sql`CREATE INDEX \`projects_tournament_idx\` ON \`projects\` (\`tournament_id\`);`)

  // 5. Rename the locked-documents-rels column freed up by the rename (same caveat).
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` RENAME COLUMN \`events_id\` TO \`tournaments_id\`;`,
  )
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_events_id_idx\`;`)
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tournaments_id_idx\` ON \`payload_locked_documents_rels\` (\`tournaments_id\`);`,
  )

  // 6. Create the new events (calendar) collection.
  await db.run(sql`CREATE TABLE \`events\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`title\` text NOT NULL,
    \`event_type\` text NOT NULL,
    \`start_date\` text NOT NULL,
    \`end_date\` text,
    \`all_day\` integer DEFAULT false NOT NULL,
    \`location\` text,
    \`team_id\` integer,
    \`description\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    FOREIGN KEY (\`team_id\`) REFERENCES \`teams\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`)
  await db.run(sql`CREATE INDEX \`events_team_idx\` ON \`events\` (\`team_id\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)

  // 7. Add payload_locked_documents_rels.events_id back (now free after step 5's rename) —
  // in this same migration, not deferred to a follow-up patch.
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`events_id\` integer REFERENCES events(id);`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_events_id_idx\`;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`events_id\`;`)
  await db.run(sql`DROP TABLE IF EXISTS \`events\`;`)

  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_tournaments_id_idx\`;`)
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` RENAME COLUMN \`tournaments_id\` TO \`events_id\`;`,
  )
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_events_id_idx\` ON \`payload_locked_documents_rels\` (\`events_id\`);`,
  )

  await db.run(sql`DROP INDEX IF EXISTS \`projects_tournament_idx\`;`)
  await db.run(sql`ALTER TABLE \`projects\` RENAME COLUMN \`tournament_id\` TO \`event_id\`;`)
  await db.run(sql`CREATE INDEX \`projects_event_idx\` ON \`projects\` (\`event_id\`);`)

  await db.run(sql`DROP INDEX IF EXISTS \`tournaments_team_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`tournaments_slug_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`tournaments_logo_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`tournaments_updated_at_idx\`;`)
  await db.run(sql`DROP INDEX IF EXISTS \`tournaments_created_at_idx\`;`)

  await db.run(sql`DROP TABLE IF EXISTS \`tournaments_coaching_staff\`;`)
  await db.run(sql`CREATE TABLE \`events_coaching_staff\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`coach_id\` integer NOT NULL,
    \`role\` text NOT NULL,
    FOREIGN KEY (\`coach_id\`) REFERENCES \`coaches\`(\`id\`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`events\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`)
  await db.run(
    sql`CREATE INDEX \`events_coaching_staff_order_idx\` ON \`events_coaching_staff\` (\`_order\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_coaching_staff_parent_id_idx\` ON \`events_coaching_staff\` (\`_parent_id\`);`,
  )
  await db.run(
    sql`CREATE INDEX \`events_coaching_staff_coach_idx\` ON \`events_coaching_staff\` (\`coach_id\`);`,
  )

  await db.run(sql`ALTER TABLE \`tournaments\` RENAME TO \`events\`;`)
  await db.run(sql`CREATE INDEX \`events_team_idx\` ON \`events\` (\`team_id\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`events_slug_idx\` ON \`events\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`events_logo_idx\` ON \`events\` (\`logo_id\`);`)
  await db.run(sql`CREATE INDEX \`events_updated_at_idx\` ON \`events\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`events_created_at_idx\` ON \`events\` (\`created_at\`);`)
}
