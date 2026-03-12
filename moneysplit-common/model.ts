import { addConstant, clone } from './serialize';
import { assert } from './util';

export interface Group {
  name: string;

  nextId: number;
  people: Person[];
  transactions: Transaction[];
}

export interface Person {
  id: number;
  name: string;
}

export interface Transaction {
  id: number;
  label: string;
  cost: number; // cents
  date: Date;
  payer: number;
  split: Split;
}

export type Split =
  | { type: 'ratio' } & RatioSplit;

export interface RatioSplit {
  participants: RatioParticipant[];
}

export interface RatioParticipant {
  person: number;
  ratio: number;
}

export interface Operation<A extends unknown[] = unknown[]> {
  name: string;
  impl: (group: Group, ...args: A) => void,
}

function define_operation<A extends unknown[]>(name: string, impl: (group: Group, ...args: A) => void): Operation<A> {
  const op = Object.freeze({
    name,
    impl,
  });

  addConstant(op);

  return op;
}

export const RENAME_GROUP = define_operation('RENAME_GROUP', (group, name: string) => {
  group.name = name;
});

export const ADD_PERSON = define_operation('ADD_PERSON', (group, person: Omit<Person, 'id'>) => {
  const id = ++group.nextId;
  group.people.push({ ...clone(person), id });
});

export const DELETE_PERSON = define_operation('DELETE_PERSON', (group, id: number) => {
  assert(canRemovePerson(group, id), 'person removal still in transactions')

  const index = group.people.findIndex(p => p.id == id);
  if (index != -1) {
    group.people.splice(index, 1);
  }
});

export const ADD_TRANSACTION = define_operation('ADD_TRANSACTION', (group, transaction: Omit<Transaction, 'id'>) => {
  const id = ++group.nextId;
  group.transactions.push({ ...clone(transaction), id });
});

export const UPDATE_TRANSACTION = define_operation('UPDATE_TRANSACTION', (group, id: number, update: Transaction) => {
  const index = group.transactions.findIndex(p => p.id == id);
  if (index != -1) {
    group.transactions[index] = update;
  }
});

export const DELETE_TRANSACTION = define_operation('DELETE_TRANSACTION', (group, id: number) => {
  const index = group.transactions.findIndex(p => p.id == id);
  if (index != -1) {
    group.transactions.splice(index, 1);
  }
});

export function canRemovePerson(group: Group, id: number) {
  return !group.transactions
    .some(t => t.payer == id || t.split.participants.some(p => p.person == id));
}

export function computeSplit(cost: number, split: Split) {
  if (split.participants.length == 0) return [];

  const totalRatio = split.participants.reduce((s, p) => s + p.ratio, 0);
  const shares = split.participants.map(p => Math.round((p.ratio / totalRatio) * cost));
  const total = shares.reduce((s, p) => s + p, 0);

  shares[0]! += cost - total;

  return shares;
}
