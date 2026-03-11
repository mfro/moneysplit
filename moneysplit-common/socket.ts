import type { Group, Operation } from './model';

export type Message =
  | { type: 'init', token: string, data: Group }
  | { type: 'apply', op: Operation<any>, args: unknown[] }
