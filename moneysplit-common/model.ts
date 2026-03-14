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

export function newGroup() {
  return {
    name: 'Group split',
    nextId: 1,
    people: [],
    transactions: [],
  };
}
