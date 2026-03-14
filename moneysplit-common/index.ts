import type { Group, Split } from './model';
import { zip } from './util';

export * from './util';
export * from './serialize';
export * from './model';
export * from './operations';
export * from './socket';

export const VERSION = 2;

export function doMigrations(version: number, group: Group) {
  if (version == VERSION) return;

  for (const transaction of group.transactions) {
    transaction.type = 'expense';
  }
}

export function computeSplit(cost: number, split: Split) {
  if (split.participants.length === 0) return [];

  const totalRatio = split.participants.reduce((s, p) => s + p.ratio, 0);
  const shares = split.participants.map(p => Math.round((p.ratio / totalRatio) * cost));
  const total = shares.reduce((s, p) => s + p, 0);

  shares[0]! += cost - total;

  return shares;
}

export function computeBalances(group: Group) {
  const balances = new Map<number, number>();

  for (const person of group.people) {
    balances.set(person.id, 0);
  }

  for (const transaction of group.transactions) {
    if (transaction.type == 'expense') {
      balances.set(transaction.payer, balances.get(transaction.payer)! + transaction.cost);

      const split = computeSplit(transaction.cost, transaction.split);
      for (const [participant, portion] of zip(transaction.split.participants, split)) {
        balances.set(participant.person, balances.get(participant.person)! - portion);
      }
    } else if (transaction.type == 'exchange') {
      balances.set(transaction.payer, balances.get(transaction.payer)! + transaction.value);
      balances.set(transaction.payee, balances.get(transaction.payee)! - transaction.value);
    }
  }

  return balances;
}
