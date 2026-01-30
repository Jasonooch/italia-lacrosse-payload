import * as migration_20260118_195739 from './20260118_195739';
import * as migration_20260120_010519 from './20260120_010519';
import * as migration_20260126_005809 from './20260126_005809';
import * as migration_20260127_202600_recreate_forms_for_plugin from './20260127_202600_recreate_forms_for_plugin';
import * as migration_20260128_134500_custom_forms from './20260128_134500_custom_forms';

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
];
