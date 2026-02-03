import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`contacts\` ADD COLUMN \`involvement\` text;`)
  await db.run(sql`ALTER TABLE \`contacts\` ADD COLUMN \`coaching_experience\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // SQLite doesn't support DROP COLUMN in older versions — rebuild the table if needed
  // For now, these columns are nullable so leaving them is safe
}
