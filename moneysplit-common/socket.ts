import type { Group, Operation } from './model';

export type Message =
  | { type: 'init', token: string, data: Group }
  | { type: 'apply', op: string | Operation<any>, args: unknown[] }
