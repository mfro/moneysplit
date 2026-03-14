import type { Group } from './model';

export type Message =
  | { type: 'init', token: string, group: Group }
  | { type: 'apply', op: string, args: unknown[] }

export const CLOSE_REASON_GROUP_NOT_FOUND = 'group not found';
export const CLOSE_REASON_VERSION_MISMATCH = 'version mismatch';
