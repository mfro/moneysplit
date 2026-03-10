import { addConstant } from './serialize';
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
  group.people.push({ ...person, id });
});

export const DELETE_PERSON = define_operation('DELETE_PERSON', (group, index: number) => {
  assert(index >= 0 && index < group.people.length, 'invalid person removal');
  const person = group.people[index];
  const invalid = group.transactions
    .some(t => t.payer == person?.id || t.split.participants.some(p => p.person == person?.id))

  assert(!invalid, 'person removal still in transactions')
  group.people.splice(index, 1);
});

export const ADD_TRANSACTION = define_operation('ADD_TRANSACTION', (group, transaction: Transaction) => {
  group.transactions.push({ ...transaction });
});

export const UPDATE_TRANSACTION = define_operation('UPDATE_TRANSACTION', (group, index: number, update: Transaction) => {
  assert(index >= 0 && index < group.transactions.length, 'invalid replace transaction');
  group.transactions[index] = update;
});

export const DELETE_TRANSACTION = define_operation('DELETE_TRANSACTION', (group, index: number) => {
  assert(index >= 0 && index < group.transactions.length, 'invalid remove transaction');
  group.transactions.splice(index, 1);
});

export function computeSplit(transaction: Transaction) {
  if (transaction.split.participants.length == 0) return [];

  const totalRatio = transaction.split.participants.reduce((s, p) => s + p.ratio, 0);
  const shares = transaction.split.participants.map(p => Math.round((p.ratio / totalRatio) * transaction.cost));
  const total = shares.reduce((s, p) => s + p, 0);

  shares[0]! += transaction.cost - total;

  return shares;
}
