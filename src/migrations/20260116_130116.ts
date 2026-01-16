import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`pointbench_region\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`pointbench_event_code\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`pointbench_year\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`pointbench_team_id\`;`)
  await db.run(sql`ALTER TABLE \`events\` DROP COLUMN \`api_roster_url\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`events\` ADD \`pointbench_region\` text NOT NULL;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`pointbench_event_code\` text NOT NULL;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`pointbench_year\` numeric NOT NULL;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`pointbench_team_id\` text DEFAULT 'ita' NOT NULL;`)
  await db.run(sql`ALTER TABLE \`events\` ADD \`api_roster_url\` text;`)
}
