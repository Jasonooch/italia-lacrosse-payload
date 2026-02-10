import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`contacts\` ADD COLUMN \`status\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite column removal is non-trivial; keeping nullable column is safe rollback behavior.
  void db
}
