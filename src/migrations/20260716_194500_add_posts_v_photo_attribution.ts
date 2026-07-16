import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 20260716_185517 added photo_attribution to posts but missed the versions
  // table that draft/version tracking writes to on every save.
  await db.run(sql`ALTER TABLE \`_posts_v\` ADD COLUMN \`version_photo_attribution\` text;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // SQLite column removal is non-trivial; keeping nullable column is safe rollback behavior.
  void db
}
