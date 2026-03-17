<template>
  <Flex align-center class="gap-2 transaction-item"
        @click="emit('edit')"
        @touchstart="() => { /* needed for mobile to show click effects */ }">

    <template v-if="transaction.type == 'expense'">

      <Flex column align-start class="gap-1">
        <span class="transaction-label">
          {{ transaction.label }}
        </span>
        <span class="transaction-split">
          {{ summary }}
        </span>
      </Flex>

      <Flex grow />

      <Flex column align-end class="gap-1">
        <span class="transaction-cost">
          {{ formatCost(transaction.cost) }}
        </span>
        <template v-if="preview">
          <Balance :value="preview" class="transaction-preview" />
        </template>
      </Flex>
    </template>

    <template v-else>
      <Flex column align-start class="gap-1">
        <span class="transaction-label" v-if="transaction.label">
          {{ transaction.label ?? '' }}
        </span>
        <span class="transaction-split">
          {{ summary }}
        </span>
      </Flex>
    </template>
  </Flex>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { assert, computeSplit, type Group, type Transaction } from 'moneysplit-common';
import { formatCost } from '@/util';
import { localUserName } from '@/localStorage';
import Flex from './Flex.vue';
import Balance from './Balance.vue';

const props = defineProps<{
  group: Group,
  transaction: Transaction,
}>();

const emit = defineEmits<{
  edit: [],
}>();

const summary = computed(() => {
  if (props.transaction.type == 'expense') {
    const payer = props.group.people.find(p => p.id === props.transaction.payer);
    assert(!!payer, 'payer not found');

    if (props.transaction.cost < 0) {
      return `Income to ${payer.name}`;
    } else {
      return `Paid by ${payer.name}`;
    }
  } else if (props.transaction.type == 'exchange') {
    const transaction = props.transaction;

    const payer = props.group.people.find(p => p.id === transaction.payer);
    assert(!!payer, 'payer not found');

    const payee = props.group.people.find(p => p.id === transaction.payee);
    assert(!!payee, 'payee not found');

    return `${payer.name} paid ${payee.name} ${formatCost(transaction.value)}`;
  }
});

const preview = computed(() => {
  const localUser = props.group.people.find(p => p.name === localUserName.value);
  if (!localUser) return null;

  if (props.transaction.type == 'expense') {
    const split = computeSplit(props.transaction.cost, props.transaction.split);
    const index = props.transaction.split.participants.findIndex(p => p.person === localUser.id)

    const paid = props.transaction.payer === localUser.id
      ? props.transaction.cost
      : 0;

    const portion = index === -1
      ? 0
      : split[index]!;

    if (paid === portion) return null;

    return paid - portion;
  } else if (props.transaction.type == 'exchange') {
    return null;
  }
});
</script>

<style scoped lang="scss">
@use "@/common.scss" as *;

.transaction-item {
  @include interactive-list-item;
  margin: 0 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);
}

.transaction-label {
  font-weight: 600;
  text-overflow: ellipsis;
}

.transaction-cost {
  font-weight: 600;
}

.transaction-split {
  color: var(--text-secondary);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-preview {
  font-size: 0.8rem;
}
</style>
