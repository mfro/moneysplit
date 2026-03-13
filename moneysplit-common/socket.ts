import type { Group } from './model';

export type Message =
  | { type: 'init', token: string, group: Group }
  | { type: 'apply', op: string, args: unknown[] }
