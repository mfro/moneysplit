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

export type Transaction =
  | { type: 'expense' } & Expense
  | { type: 'exchange' } & Exchange

export interface Expense {
  id: number;
  label: string;
  cost: number; // cents
  date: Date;
  payer: number;
  split: Split;
}

export interface Exchange {
  id: number;
  label: string | null;
  value: number;
  date: Date;
  payer: number;
  payee: number;
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

export function newGroup() {
  return {
    name: 'Group split',
    nextId: 1,
    people: [],
    transactions: [],
  };
}
