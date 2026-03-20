import { assert, never } from './util';
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
  assert(isString(name) && name.trim().length > 0 && name.trim().length < 1024, 'invalid group name');

  group.name = name.trim();
});

export const ADD_PERSON = define('ADD_PERSON', (group, person: Omit<Person, 'id'>) => {
  assert(isValidPerson(person as Person, false), 'invalid person');
  assert(canAddPerson(group, person.name), 'invalid add person');

  const id = ++group.nextId;
  const name = person.name.trim()

  group.people.push({ id, name });
});

export const UPDATE_PERSON = define('UPDATE_PERSON', (group, update: Person) => {
  assert(isValidPerson(update, true), 'invalid person');
  assert(canUpdatePerson(group, update), 'invalid person update');

  const person = group.people.find(p => p.id === update.id);
  if (person) {
    person.name = update.name.trim();
  }
});

export const DELETE_PERSON = define('DELETE_PERSON', (group, id: number) => {
  assert(isInt(id), 'invalid person id');
  assert(canDeletePerson(group, id), 'person removal still in transactions')

  const index = group.people.findIndex(p => p.id === id);
  if (index !== -1) {
    group.people.splice(index, 1);
  }
});

export const ADD_TRANSACTION = define('ADD_TRANSACTION', (group, transaction: Omit<Transaction, 'id'>) => {
  assert(isValidTransaction(transaction as Transaction, false), 'invalid transaction');
  assert(transactionReferencesValidPeople(group, transaction as Transaction), 'invalid people in transaction');

  const id = ++group.nextId;
  group.transactions.push({ ...clone(transaction), id } as Transaction);
});

export const UPDATE_TRANSACTION = define('UPDATE_TRANSACTION', (group, update: Transaction) => {
  assert(isValidTransaction(update, true), 'invalid transaction');
  assert(transactionReferencesValidPeople(group, update), 'invalid people in transaction');

  const index = group.transactions.findIndex(p => p.id === update.id);
  if (index !== -1) {
    group.transactions[index] = update;
  }
});

export const DELETE_TRANSACTION = define('DELETE_TRANSACTION', (group, id: number) => {
  assert(isInt(id), 'invalid transaction id');

  const index = group.transactions.findIndex(p => p.id === id);
  if (index !== -1) {
    group.transactions.splice(index, 1);
  }
});

function isString(v: any): v is string {
  return typeof v === 'string';
}

function isNumber(v: any): v is number {
  return typeof v === 'number' && !isNaN(v);
}

function isInt(v: any): v is number {
  return Number.isInteger(v);
}

function isDate(v: any): v is Date {
  return v instanceof Date && !isNaN(v.getTime());
}

export function canAddPerson(group: Group, name: string) {
  return !group.people.find(p => p.name === name.trim())
    && name.trim().length > 0 && name.trim().length < 1024;
}

export function canUpdatePerson(group: Group, person: Person) {
  return !group.people.find(p => p.name === person.name.trim() && p.id !== person.id)
    && person.name.trim().length > 0 && person.name.trim().length < 1024;
}

export function canDeletePerson(group: Group, id: number) {
  return !group.transactions.some(t => isInvolved(t, id));
}

export function transactionReferencesValidPeople(group: Group, transaction: Transaction): boolean {
  const peopleIds = new Set(group.people.map(p => p.id));
  if (!peopleIds.has(transaction.payer)) return false;

  if (transaction.type === 'expense') {
    for (const p of transaction.split.participants) {
      if (!peopleIds.has(p.person)) return false;
    }
  } else if (transaction.type === 'exchange') {
    if (!peopleIds.has(transaction.payee)) return false;
  }

  return true;
}

export function isInvolved(transaction: Transaction, person: number) {
  if (transaction.type === 'expense') {
    return transaction.payer === person || transaction.split.participants.some(p => p.person === person)
  } else if (transaction.type === 'exchange') {
    return transaction.payer === person || transaction.payee === person;
  } else {
    never(transaction);
  }
}

export function isValidPerson(person: Person, requireId = true): person is Person {
  if (!person || typeof person !== 'object') return false;
  if (requireId && !isInt(person.id)) return false;
  if (!isString(person.name) || person.name.trim().length === 0 || person.name.trim().length >= 1024) return false;
  return true;
}

export function isValidTransaction(transaction: Transaction, requireId = true): transaction is Transaction {
  if (!transaction || typeof transaction !== 'object') return false;
  if (requireId && !isInt(transaction.id)) return false;
  if (!isDate(transaction.date)) return false;
  if (!isInt(transaction.payer)) return false;

  if (transaction.type === 'expense') {
    if (!isString(transaction.label) || transaction.label.trim().length === 0 || transaction.label.trim().length >= 1024) return false;
    if (!isInt(transaction.cost)) return false;
    if (!isValidSplit(transaction.split)) return false;
    return true;
  } else if (transaction.type === 'exchange') {
    if (transaction.label !== null && (!isString(transaction.label) || transaction.label.trim().length === 0 || transaction.label.trim().length >= 1024)) return false;
    if (!isInt(transaction.value) || transaction.value < 0) return false;
    if (!isInt(transaction.payee)) return false;
    return true;
  }

  return false;
}

export function isValidSplit(split: Split): split is Split {
  if (!split || typeof split !== 'object') return false;
  if (split.type === 'ratio') {
    if (!Array.isArray(split.participants)) return false;
    if (split.participants.length === 0) return false;
    for (const p of split.participants) {
      if (!p || typeof p !== 'object') return false;
      if (!isInt(p.person) || !isNumber(p.ratio) || p.ratio < 0) return false;
    }
    return true;
  }
  return false;
}
