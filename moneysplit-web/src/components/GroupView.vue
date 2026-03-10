<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { type Driver } from '../driver';
import { ADD_TRANSACTION, assert, computeSplit, dateEquals, DELETE_TRANSACTION, UPDATE_TRANSACTION, type Transaction } from '../../../moneysplit-common';
import Flex from '../ui/Flex.vue';
import { Button, Drawer } from 'primevue';
import GroupEditor from './GroupEditor.vue';
import TransactionEditor from './TransactionEditor.vue';
import { localUserName } from '@/localStorage';
import TransactionItem from '@/ui/TransactionItem.vue';

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

const schedule = computed(() => {
  const list = sortedTransactions.value;
  if (!list?.length) return [];

  let group = {
    date: list[0]!.transaction.date,
    entries: [] as { transaction: Transaction, index: number }[],
  };

  const groups = [group];

  for (const entry of list ?? []) {
    if (!dateEquals(group.date, entry.transaction.date)) {
      groups.push(group = {
        date: entry.transaction.date,
        entries: [],
      });
    }

    group.entries.push(entry);
  }

  return groups;
});

function transactionSummary(transaction: Transaction) {
  const payer = group.value!.people.find(p => p.id == transaction.payer);
  assert(payer != null, 'payer not found');

  if (transaction.cost < 0) {
    return `Income to ${payer.name}`;
  } else {
    return `Payed by ${payer.name}`;
  }
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
    <Flex row align-center class="gap-2 px-2 py-4 header">
      <Button icon="yes" rounded variant="text" size="small"
              @click="close" style="flex: 0 0 auto">
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

      <Button icon="yes" rounded variant="text" size="small"
              @click="isEditing = true" style="flex: 0 0 auto">
        <span class="material-symbols-outlined">more_horiz</span>
      </Button>
    </Flex>

    <Flex column class="gap-2 transactions">
      <template v-for="{ date, entries } in schedule">
        <Flex class="px-3 mt-3">
          <label class="date-header">
            {{
              date.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            }}
          </label>
        </Flex>
        <template v-for="{ transaction, index } in entries">
          <TransactionItem :group="group" :transaction="transaction"
                           @edit="editTransaction = index" />
        </template>
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

    <Drawer position="bottom" header="Edit Transaction" style="height: auto"
            :visible="typeof editTransaction == 'number'"
            @update:visible="editTransaction = undefined">

      <TransactionEditor :driver="driver"
                         :model-value="group.transactions[editTransaction!]!"
                         @update:model-value="saveTransaction" />

      <div style="margin-top: 2rem" />
    </Drawer>

    <Drawer position="bottom" header="Group Details" style="height: auto"
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
  height: 100svh;
  background-color: white;
}

.header {
  border-bottom: 1px solid var(--p-content-border-color);
}

.group-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.loading-text {
  color: var(--text-secondary);
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
}

.transactions {
  overflow-y: auto;
}

.date-header {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.add-button-container {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  right: 2rem;
  pointer-events: none;

  > button {
    pointer-events: all;
    box-shadow: 0 0 1rem white, 0 0 1rem white;
  }
}
</style>
