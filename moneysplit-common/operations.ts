import { assert } from './util';
import { clone } from './serialize';
import type { Group, Person, Transaction, Split } from './model';

export interface Operation<A extends unknown[] = unknown[]> {
  name: string;
  impl: (group: Group, ...args: A) => void,
}

export const operations = new Map<string, Operation<any>>();

function define<A extends unknown[]>(name: string, impl: (group: Group, ...args: A) => void): Operation<A> {
  const op = Object.freeze({
    name,
    impl,
  });

  operations.set(name, op);

  return op;
}

export const RENAME_GROUP = define('RENAME_GROUP', (group, name: string) => {
  assert(name.length > 0 && name.length < 1024, 'invalid group name');

  group.name = name.trim();
});

export const ADD_PERSON = define('ADD_PERSON', (group, person: Omit<Person, 'id'>) => {
  assert(canAddPerson(group, person.name), 'invalid add person');

  const id = ++group.nextId;
  const name = person.name.trim()

  group.people.push({ id, name });
});

export const UPDATE_PERSON = define('UPDATE_PERSON', (group, update: Person) => {
  assert(canUpdatePerson(group, update), 'invalid add person');

  const person = group.people.find(p => p.id === update.id);
  if (person) {
    person.name = update.name;
  }
});

export const DELETE_PERSON = define('DELETE_PERSON', (group, id: number) => {
  assert(canDeletePerson(group, id), 'person removal still in transactions')

  const index = group.people.findIndex(p => p.id === id);
  if (index !== -1) {
    group.people.splice(index, 1);
  }
});

export const ADD_TRANSACTION = define('ADD_TRANSACTION', (group, transaction: Omit<Transaction, 'id'>) => {
  assert(transaction.label.length < 1024, 'invalid group name');

  const id = ++group.nextId;
  group.transactions.push({ ...clone(transaction), id });
});

export const UPDATE_TRANSACTION = define('UPDATE_TRANSACTION', (group, update: Transaction) => {
  assert(update.label.length < 1024, 'invalid group name');

  const index = group.transactions.findIndex(p => p.id === update.id);
  if (index !== -1) {
    group.transactions[index] = update;
  }
});

export const DELETE_TRANSACTION = define('DELETE_TRANSACTION', (group, id: number) => {
  const index = group.transactions.findIndex(p => p.id === id);
  if (index !== -1) {
    group.transactions.splice(index, 1);
  }
});

export function canAddPerson(group: Group, name: string) {
  return !group.people.find(p => p.name === name.trim())
    && name.trim().length > 0 && name.trim().length < 1024;
}

export function canUpdatePerson(group: Group, person: Person) {
  return !group.people.find(p => p.name === person.name.trim() && p.id !== person.id)
    && person.name.trim().length > 0 && person.name.trim().length < 1024;
}

export function canDeletePerson(group: Group, id: number) {
  return !group.transactions
    .some(t => t.payer === id || t.split.participants.some(p => p.person === id));
}

export function computeSplit(cost: number, split: Split) {
  if (split.participants.length === 0) return [];

  const totalRatio = split.participants.reduce((s, p) => s + p.ratio, 0);
  const shares = split.participants.map(p => Math.round((p.ratio / totalRatio) * cost));
  const total = shares.reduce((s, p) => s + p, 0);

  shares[0]! += cost - total;

  return shares;
}
