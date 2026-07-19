import * as migration_20260118_195739 from './20260118_195739';
import * as migration_20260120_010519 from './20260120_010519';
import * as migration_20260126_005809 from './20260126_005809';
import * as migration_20260127_202600_recreate_forms_for_plugin from './20260127_202600_recreate_forms_for_plugin';
import * as migration_20260128_134500_custom_forms from './20260128_134500_custom_forms';
import * as migration_20260202_add_contacts_involvement_fields from './20260202_add_contacts_involvement_fields';
import * as migration_20260209_191600_add_contacts_status from './20260209_191600_add_contacts_status';
import * as migration_20260716_185517_add_posts_photo_attribution from './20260716_185517_add_posts_photo_attribution';
import * as migration_20260716_194500_add_posts_v_photo_attribution from './20260716_194500_add_posts_v_photo_attribution';
import * as migration_20260717_000000_add_projects from './20260717_000000_add_projects';
import * as migration_20260717_010000_add_projects_locked_docs_rel from './20260717_010000_add_projects_locked_docs_rel';
import * as migration_20260718_000000_rename_events_to_tournaments_and_add_events from './20260718_000000_rename_events_to_tournaments_and_add_events';
import * as migration_20260718_010000_add_project_resources_and_files from './20260718_010000_add_project_resources_and_files';

export const migrations = [
  {
    up: migration_20260118_195739.up,
    down: migration_20260118_195739.down,
    name: '20260118_195739',
  },
  {
    up: migration_20260120_010519.up,
    down: migration_20260120_010519.down,
    name: '20260120_010519',
  },
  {
    up: migration_20260126_005809.up,
    down: migration_20260126_005809.down,
    name: '20260126_005809'
  },
  {
    up: migration_20260127_202600_recreate_forms_for_plugin.up,
    down: migration_20260127_202600_recreate_forms_for_plugin.down,
    name: '20260127_202600_recreate_forms_for_plugin'
  },
  {
    up: migration_20260128_134500_custom_forms.up,
    down: migration_20260128_134500_custom_forms.down,
    name: '20260128_134500_custom_forms'
  },
  {
    up: migration_20260202_add_contacts_involvement_fields.up,
    down: migration_20260202_add_contacts_involvement_fields.down,
    name: '20260202_add_contacts_involvement_fields'
  },
  {
    up: migration_20260209_191600_add_contacts_status.up,
    down: migration_20260209_191600_add_contacts_status.down,
    name: '20260209_191600_add_contacts_status'
  },
  {
    up: migration_20260716_185517_add_posts_photo_attribution.up,
    down: migration_20260716_185517_add_posts_photo_attribution.down,
    name: '20260716_185517_add_posts_photo_attribution'
  },
  {
    up: migration_20260716_194500_add_posts_v_photo_attribution.up,
    down: migration_20260716_194500_add_posts_v_photo_attribution.down,
    name: '20260716_194500_add_posts_v_photo_attribution'
  },
  {
    up: migration_20260717_000000_add_projects.up,
    down: migration_20260717_000000_add_projects.down,
    name: '20260717_000000_add_projects'
  },
  {
    up: migration_20260717_010000_add_projects_locked_docs_rel.up,
    down: migration_20260717_010000_add_projects_locked_docs_rel.down,
    name: '20260717_010000_add_projects_locked_docs_rel'
  },
  {
    up: migration_20260718_000000_rename_events_to_tournaments_and_add_events.up,
    down: migration_20260718_000000_rename_events_to_tournaments_and_add_events.down,
    name: '20260718_000000_rename_events_to_tournaments_and_add_events'
  },
  {
    up: migration_20260718_010000_add_project_resources_and_files.up,
    down: migration_20260718_010000_add_project_resources_and_files.down,
    name: '20260718_010000_add_project_resources_and_files'
  },
];
