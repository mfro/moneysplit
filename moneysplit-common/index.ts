import type { Group } from './model';

export * from './util';
export * from './serialize';
export * from './model';
export * from './operations';
export * from './socket';

export const VERSION = 2;

export function doMigrations(version: number, group: Group) {
  if (version == VERSION) return;

  for (const transaction of group.transactions) {
    transaction.type = 'expense';
  }
}
