import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260108_181344 from './20260108_181344';
import * as migration_20260108_184708 from './20260108_184708';
import * as migration_20260111_203842 from './20260111_203842';
import * as migration_20260116_130116 from './20260116_130116';
import * as migration_20260116_142610 from './20260116_142610';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260108_181344.up,
    down: migration_20260108_181344.down,
    name: '20260108_181344',
  },
  {
    up: migration_20260108_184708.up,
    down: migration_20260108_184708.down,
    name: '20260108_184708',
  },
  {
    up: migration_20260111_203842.up,
    down: migration_20260111_203842.down,
    name: '20260111_203842',
  },
  {
    up: migration_20260116_130116.up,
    down: migration_20260116_130116.down,
    name: '20260116_130116',
  },
  {
    up: migration_20260116_142610.up,
    down: migration_20260116_142610.down,
    name: '20260116_142610'
  },
];
