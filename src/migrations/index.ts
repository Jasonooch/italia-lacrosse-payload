import * as migration_20260118_195739 from './20260118_195739';
import * as migration_20260120_010519 from './20260120_010519';

export const migrations = [
  {
    up: migration_20260118_195739.up,
    down: migration_20260118_195739.down,
    name: '20260118_195739',
  },
  {
    up: migration_20260120_010519.up,
    down: migration_20260120_010519.down,
    name: '20260120_010519'
  },
];
