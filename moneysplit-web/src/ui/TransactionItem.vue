<template>
  <Flex align-center class="gap-2 transaction-item"
        @click="emit('edit')">

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
  </Flex>
</template>

<script setup lang="ts">
import { assert, computeSplit, type Group, type Transaction } from '../../../moneysplit-common';
import { localUserName } from '@/localStorage';
import { formatCost } from '@/util';
import { computed } from 'vue';
import Flex from './Flex.vue';
import Balance from './Balance.vue';

const props = defineProps<{
  group: Group,
  transaction: Transaction
}>();

const emit = defineEmits<{
  edit: [],
}>();

const summary = computed(() => {
  const payer = props.group.people.find(p => p.id == props.transaction.payer);
  assert(payer != null, 'payer not found');

  if (props.transaction.cost < 0) {
    return `Income to ${payer.name}`;
  } else {
    return `Paid by ${payer.name}`;
  }
});

const preview = computed(() => {
  const localUser = props.group.people.find(p => p.name == localUserName.value);
  if (!localUser) return null;

  const split = computeSplit(props.transaction.cost, props.transaction.split);
  const index = props.transaction.split.participants.findIndex(p => p.person == localUser.id)

  const paid = props.transaction.payer == localUser.id
    ? props.transaction.cost
    : 0;

  const portion = index == -1
    ? 0
    : split[index]!;

  if (paid == portion) return null;

  return paid - portion;
});
</script>

<style scoped lang="scss">
.transaction-item {
  cursor: pointer;
  user-select: none;
  margin: 0 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);

  &:hover {
    background-color: var(--p-primary-200);
  }

  &:active {
    background-color: var(--p-primary-300);
  }
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
