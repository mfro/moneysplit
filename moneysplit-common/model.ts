import { addConstant } from './serialize';
import { assert } from './util';

export interface Group {
  name: string;

  people: Person[];
  transactions: Transaction[];
}

export interface Person {
  name: string;
}

export interface Transaction {
  cost: number;
  split: Split;
}

export type Split =
  | { type: 'ratio' } & RatioSplit;

export interface RatioSplit {
  participants: {
    person: Person;
    ratio: number;
  }[];
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

export const ADD_PERSON = define_operation('ADD_PERSON', (group, person: Person) => {
  group.people.push({ ...person });
});

export const REPLACE_PERSON = define_operation('REPLACE_PERSON', (group, index: number, update: Person) => {
  assert(index >= 0 && index < group.people.length, 'invalid replace person');
  group.people[index] = update;
});

export const REMOVE_PERSON = define_operation('REMOVE_PERSON', (group, index: number) => {
  assert(index >= 0 && index < group.people.length, 'invalid person removal');
  group.people.splice(index, 1);
});

export const ADD_TRANSACTION = define_operation('ADD_TRANSACTION', (group, transaction: Transaction) => {
  group.transactions.push({ ...transaction });
});

export const REPLACE_TRANSACTION = define_operation('REPLACE_TRANSACTION', (group, index: number, update: Transaction) => {
  assert(index >= 0 && index < group.transactions.length, 'invalid replace transaction');
  group.transactions[index] = update;
});

export const REMOVE_TRANSACTION = define_operation('REMOVE_TRANSACTION', (group, index: number) => {
  assert(index >= 0 && index < group.transactions.length, 'invalid remove transaction');
  group.transactions.splice(index, 1);
});
