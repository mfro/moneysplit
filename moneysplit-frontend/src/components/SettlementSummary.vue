<script setup lang="ts">
import { computed } from 'vue';
import type { Group, Person } from '../../../moneysplit-common';
import Flex from '../ui/Flex.vue';

const props = defineProps<{
  group: Group;
}>();

interface Balance {
  person: Person;
  net: number;
}

interface Payment {
  from: Person;
  to: Person;
  amount: number;
}

const balances = computed<Balance[]>(() => {
  const map = new Map<Person, number>();

  for (const person of props.group.people) {
    map.set(person, 0);
  }

  for (const tx of props.group.transactions) {
    const totalRatio = tx.split.participants.reduce((s, p) => s + p.ratio, 0);
    if (totalRatio === 0) continue;

    for (const p of tx.split.participants) {
      const share = (p.ratio / totalRatio) * tx.cost;
      map.set(p.person, (map.get(p.person) ?? 0) - share);
    }
  }

  return props.group.people
    .map(person => ({ person, net: map.get(person) ?? 0 }))
    .sort((a, b) => a.net - b.net);
});

const payments = computed<Payment[]>(() => {
  const debtors = balances.value
    .filter(b => b.net < -0.005)
    .map(b => ({ person: b.person, amount: -b.net }));
  const creditors = balances.value
    .filter(b => b.net > 0.005)
    .map(b => ({ person: b.person, amount: b.net }));

  const result: Payment[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di]!;
    const c = creditors[ci]!;
    const amount = Math.min(d.amount, c.amount);

    result.push({ from: d.person, to: c.person, amount });

    d.amount -= amount;
    c.amount -= amount;

    if (d.amount < 0.005) di++;
    if (c.amount < 0.005) ci++;
  }

  return result;
});

function formatAmount(n: number) {
  return `$${Math.abs(n).toFixed(2)}`;
}
</script>

<template>
  <div class="card">
    <Flex row align-center justify-space-between class="mb-4">
      <h3 class="panel-title">Settlement</h3>
    </Flex>

    <div v-if="group.people.length === 0" class="empty-state py-4">
      Add people to see settlements.
    </div>

    <template v-else>
      <!-- Balances -->
      <Flex column class="gap-1 mb-4">
        <Flex row align-center class="gap-2 balance-row"
              v-for="b in balances"
              :key="b.person.name"
              :class="{ positive: b.net > 0.005, negative: b.net < -0.005 }">
          <span class="balance-name">{{ b.person.name }}</span>
          <span class="balance-amount" v-if="b.net > 0.005">+{{
            formatAmount(b.net) }}</span>
          <span class="balance-amount" v-else-if="b.net < -0.005">-{{
            formatAmount(b.net) }}</span>
          <span class="balance-amount settled" v-else>settled</span>
        </Flex>
      </Flex>

      <!-- Suggested payments -->
      <div v-if="payments.length" class="payments pt-3">
        <h4 class="mb-2">Suggested Payments</h4>
        <Flex row align-center class="gap-2 payment-row"
              v-for="(p, i) in payments" :key="i">
          <span class="payment-from">{{ p.from.name }}</span>
          <span class="payment-arrow">→</span>
          <span class="payment-to">{{ p.to.name }}</span>
          <span class="payment-amount">{{ formatAmount(p.amount) }}</span>
        </Flex>
      </div>

      <div v-else-if="group.transactions.length" class="all-settled py-3">
        ✓ Everyone is settled up!
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.panel-title {
  font-size: 1rem;
  font-weight: 600;
}

.balance-row {
  padding: 6px 8px;
  border-radius: var(--radius-sm);

  &.positive .balance-amount {
    color: var(--green);
  }

  &.negative .balance-amount {
    color: var(--red);
  }
}

.balance-name {
  font-size: 0.9rem;
  flex: 1;
}

.balance-amount {
  font-size: 0.85rem;
  font-weight: 600;

  &.settled {
    color: var(--text-muted);
    font-weight: 400;
  }
}

.payments {
  border-top: 1px solid var(--border);

  h4 {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
}

.payment-row {
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.payment-from {
  font-weight: 500;
  color: var(--red);
}

.payment-arrow {
  color: var(--text-muted);
}

.payment-to {
  font-weight: 500;
  color: var(--green);
}

.payment-amount {
  margin-left: auto;
  font-weight: 600;
}

.all-settled {
  text-align: center;
  color: var(--green);
  font-size: 0.9rem;
  font-weight: 500;
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}
</style>
