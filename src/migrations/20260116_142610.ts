import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`teams\` ADD \`hero_heading\` text;`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`hero_stat_line\` text;`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`about_heading\` text;`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`about_content\` text;`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`about_image1_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`about_image2_id\` integer REFERENCES media(id);`)
  await db.run(sql`ALTER TABLE \`teams\` ADD \`join_us_c_t_a_image_id\` integer REFERENCES media(id);`)
  await db.run(sql`CREATE INDEX \`teams_about_image1_idx\` ON \`teams\` (\`about_image1_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_about_image2_idx\` ON \`teams\` (\`about_image2_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_join_us_c_t_a_image_idx\` ON \`teams\` (\`join_us_c_t_a_image_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_teams\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text,
  	\`short_name\` text,
  	\`display_name\` text,
  	\`donation_image_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`donation_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_teams\`("id", "name", "slug", "short_name", "display_name", "donation_image_id", "updated_at", "created_at") SELECT "id", "name", "slug", "short_name", "display_name", "donation_image_id", "updated_at", "created_at" FROM \`teams\`;`)
  await db.run(sql`DROP TABLE \`teams\`;`)
  await db.run(sql`ALTER TABLE \`__new_teams\` RENAME TO \`teams\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE UNIQUE INDEX \`teams_name_idx\` ON \`teams\` (\`name\`);`)
  await db.run(sql`CREATE UNIQUE INDEX \`teams_slug_idx\` ON \`teams\` (\`slug\`);`)
  await db.run(sql`CREATE INDEX \`teams_donation_image_idx\` ON \`teams\` (\`donation_image_id\`);`)
  await db.run(sql`CREATE INDEX \`teams_updated_at_idx\` ON \`teams\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`teams_created_at_idx\` ON \`teams\` (\`created_at\`);`)
}
