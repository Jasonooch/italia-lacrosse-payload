import * as migration_20260118_195739 from './20260118_195739';
import * as migration_20260120_010519 from './20260120_010519';
import * as migration_20260126_005809 from './20260126_005809';

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
];
