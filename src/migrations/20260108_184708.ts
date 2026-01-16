import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`players\` ADD \`first_name\` text NOT NULL;`)
  await db.run(sql`ALTER TABLE \`players\` ADD \`last_name\` text NOT NULL;`)
  await db.run(sql`ALTER TABLE \`players\` ADD \`full_name\` text;`)
  await db.run(sql`ALTER TABLE \`players\` DROP COLUMN \`name\`;`)
  await db.run(sql`ALTER TABLE \`players\` DROP COLUMN \`date_of_birth\`;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`players\` ADD \`name\` text NOT NULL;`)
  await db.run(sql`ALTER TABLE \`players\` ADD \`date_of_birth\` text;`)
  await db.run(sql`ALTER TABLE \`players\` DROP COLUMN \`first_name\`;`)
  await db.run(sql`ALTER TABLE \`players\` DROP COLUMN \`last_name\`;`)
  await db.run(sql`ALTER TABLE \`players\` DROP COLUMN \`full_name\`;`)
}
