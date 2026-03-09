<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { type Driver } from '../driver';
import { ADD_TRANSACTION, assert, computeSplit, DELETE_TRANSACTION, UPDATE_TRANSACTION, type Transaction } from '../../../moneysplit-common';
import Flex from '../ui/Flex.vue';
import { Button, Drawer } from 'primevue';
import GroupEditor from './GroupEditor.vue';
import { formatCost } from '@/util';
import TransactionEditor from './TransactionEditor.vue';
import { localUserName } from '@/localStorage';
import Balance from '@/ui/Balance.vue';

const props = defineProps<{
  driver: Driver;
}>();

const emit = defineEmits<{
  close: [];
}>();

const group = computed(() => props.driver.state.data);

const isEditing = ref(false);

function close() {
  emit('close');
}

watchEffect(() => {
  const token = props.driver.state.token;
  if (token) {
    const url = new URL(location.href);
    url.searchParams.set('token', token);
    history.replaceState(null, '', url);
  }
});

const newTransaction = ref(false);
const editTransaction = ref<number>();

const sortedTransactions = computed(() => {
  return group.value?.transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort((a, b) => b.transaction.date.valueOf() - a.transaction.date.valueOf());
});

function transactionSummary(transaction: Transaction) {
  const payer = group.value!.people.find(p => p.id == transaction.payer);
  assert(payer != null, 'payer not found');

  return `Payed by ${payer.name} on ${transaction.date.toLocaleDateString()}`;
}

function transactionPreview(transaction: Transaction) {
  const localUser = group.value!.people.find(p => p.name == localUserName.value);
  if (!localUser) return null;

  const split = computeSplit(transaction);
  const index = transaction.split.participants.findIndex(p => p.person == localUser.id)

  const paid = transaction.payer == localUser.id
    ? transaction.cost
    : 0;

  const portion = index == -1
    ? 0
    : split[index]!;

  if (paid == portion) return null;

  return paid - portion;
}

function createTransaction(transaction: Transaction | null) {
  if (transaction != null) {
    props.driver.apply(ADD_TRANSACTION, transaction);
    newTransaction.value = false;
  }
}

function saveTransaction(transaction: Transaction | null) {
  assert(editTransaction.value !== undefined, 'invalid save transaction');

  if (transaction == null) {
    props.driver.apply(DELETE_TRANSACTION, editTransaction.value);
    editTransaction.value = undefined;
  } else {
    props.driver.apply(UPDATE_TRANSACTION, editTransaction.value, transaction);
    editTransaction.value = undefined;
  }
}
</script>

<template>
  <Flex column class="group-view" v-if="group">
    <Flex row align-center class="gap-2 px-2 py-5">
      <Button icon="yes" rounded variant="text" size="small"
              severity="secondary" @click="close"
              style="flex: 0 0 auto">
        <span class="material-symbols-outlined">chevron_left</span>
      </Button>

      <Flex column class="gap-1">
        <h1 class="group-title" style="display: inline">{{ group.name }}</h1>

        <span style="color: var(--text-muted)">
          {{ group.people.length }}
          member{{ group.people.length == 1 ? '' : 's' }}
        </span>
      </Flex>

      <Flex grow />

      <Button icon="yes" rounded variant="text" severity="secondary"
              @click="isEditing = true" style="flex: 0 0 auto">
        <span class="material-symbols-outlined">more_horiz</span>
      </Button>
    </Flex>

    <Flex column class="pa-3 gap-1" style="overflow: hidden">
      <template v-for="{ transaction, index } in sortedTransactions">
        <Flex align-center class="gap-2 transaction-item"
              @click="editTransaction = index">

          <Flex column align-start class="gap-1">
            <span class="transaction-label">
              {{ transaction.label }}
            </span>
            <span class="transaction-split">
              {{ transactionSummary(transaction) }}
            </span>
          </Flex>

          <Flex grow />

          <Flex column align-end class="gap-1">
            <span class="transaction-cost">
              {{ formatCost(transaction.cost) }}
            </span>
            <template v-if="transactionPreview(transaction)">
              <Balance :value="transactionPreview(transaction)!" class="transaction-preview" />
            </template>
          </Flex>
        </Flex>
      </template>

      <div style="margin-top: 6rem" />

      <p v-if="!group.people.length" class="empty-state py-4">
        This group is empty
      </p>

      <p v-else-if="!group.transactions.length" class="empty-state py-4">
        Start spending money
      </p>
    </Flex>

    <Drawer position="bottom" header="Add Transaction" style="height: auto"
            v-model:visible="newTransaction">

      <TransactionEditor :driver="driver" :model-value="null"
                         @update:model-value="createTransaction" />

      <div style="margin-top: 2rem" />
    </Drawer>

    <Drawer position="bottom" header="Add Transaction" style="height: auto"
            :visible="typeof editTransaction == 'number'"
            @update:visible="editTransaction = undefined">

      <TransactionEditor :driver="driver"
                         :model-value="group.transactions[editTransaction!]!"
                         @update:model-value="saveTransaction" />

      <div style="margin-top: 2rem" />
    </Drawer>

    <Drawer position="bottom" header="Edit Group" style="height: auto"
            v-model:visible="isEditing">

      <GroupEditor :driver="driver" :model-value="group" />

      <div style="margin-top: 2rem" />
    </Drawer>

    <Flex row align-center justify-center class="gap-2 add-button-container"
          v-if="group.people.length">
      <Button @click="() => newTransaction = true">
        <span class="material-symbols-outlined">add_notes</span>
        Add transaction
      </Button>
    </Flex>
  </Flex>

  <Flex grow align-center justify-center v-else>
    <p class="loading-text">Connecting…</p>
  </Flex>
</template>

<style scoped lang="scss">
.group-view {
  width: 100%;
  min-height: 100svh;
  background-color: white;
}

.group-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.loading-text {
  color: var(--text-secondary);
}

.transaction-item {
  cursor: pointer;
  padding: 10px 48px;
  margin: 0 -48px;
  user-select: none;

  &:hover {
    background-color: var(--p-button-text-secondary-hover-background);
  }

  &:active {
    background-color: var(--p-button-text-secondary-active-background);
  }
}

.add-button-container {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  right: 2rem;
}

.transaction-label {
  font-weight: 600;
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

.empty-state {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
}
</style>
