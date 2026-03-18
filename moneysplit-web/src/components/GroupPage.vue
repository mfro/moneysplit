<template>
  <Flex column class="group-view">
    <Flex row align-center class="gap-2 px-2 py-4 header"
          :class="{ 'no-border': driver.state.isPendingSync || driver.state.isConnecting }">
      <div class="sync-bar"
           v-if="driver.state.isPendingSync || driver.state.isConnecting">
        <span />
        <span />
      </div>

      <Button icon="yes" rounded variant="text" size="small"
              @click="close" style="flex: 0 0 auto">
        <Icon :src="icon_chevron_left" />
      </Button>

      <Flex column class="gap-1">
        <template v-if="group">
          <h1 class="group-title">
            {{ group.name }}
          </h1>

          <Flex align-center>
            <template
                      v-if="!driver.state.isConnected && !driver.state.isConnecting">
              <Icon :src="icon_cloud_off" class="mr-2"
                    style="margin: -100% 0; color: var(--danger-color)"
                    @click="driver.startConnection()" />
            </template>

            <span style="color: var(--text-muted)">
              {{ group.people.length }}
              member{{ group.people.length === 1 ? '' : 's' }}
            </span>
          </Flex>
        </template>

        <template v-else>
          <h1 class="group-title">&nbsp;</h1>

          <Flex align-center>
            <span>&nbsp;</span>
          </Flex>
        </template>
      </Flex>

      <Flex grow />

      <template v-if="group">
        <Button icon="yes" rounded variant="text" size="small"
                @click="isEditing = true"
                style="flex: 0 0 auto">
          <Icon :src="icon_more_horiz" />
        </Button>
      </template>
    </Flex>

    <template v-if="group">
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
          <template v-for="transaction in entries">
            <TransactionItem :group="group" :transaction="transaction"
                             @edit="editTransaction = transaction" />
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

      <Dialog modal header="Join Group" v-model:visible="addingPerson"
              style="width: calc(100svw - 1.5rem)">

        <JoinForm :driver="driver" @add-person="addPerson"
                  @associate-person="associatePerson" />
      </Dialog>

      <Drawer position="bottom" header="Add Transaction" :dismissable="false"
              v-model:visible="newTransaction">

        <TransactionEditor :driver="driver" :model-value="null"
                           @update:model-value="createTransaction" />
      </Drawer>

      <Drawer position="bottom" header="Edit Transaction" :dismissable="false"
              :visible="!!editTransaction"
              @update:visible="editTransaction = undefined">

        <TransactionEditor :driver="driver" :model-value="editTransaction"
                           @update:model-value="saveTransaction"
                           v-if="editTransaction" />
      </Drawer>

      <Drawer position="bottom" header="Group Details"
              v-model:visible="isEditing">

        <GroupDetails :driver="driver" :model-value="group" />
      </Drawer>

      <Flex row align-center justify-center class="gap-2 button-container">
        <Button @click="joinGroup()" v-if="showJoinButton">
          <Icon :src="icon_person_add" />
          Join
        </Button>

        <Button @click="() => newTransaction = true" v-else>
          <Icon :src="icon_add_notes" />
          Add transaction
        </Button>
      </Flex>
    </template>

    <template
              v-else-if="driver.state.close_reason === CLOSE_REASON_GROUP_NOT_FOUND">
      <Flex align-center justify-center class="my-6">
        <span>Group not found</span>
      </Flex>
    </template>

    <template v-else-if="!driver.state.isConnecting">
      <Flex align-center justify-center class="my-6">
        <Button text @click="driver.startConnection()" severity="secondary">
          <Icon :src="icon_cloud_off"
                style="color: var(--danger-color)"
                @click="driver.startConnection()" />
          <span>Connection failed</span>
        </Button>
      </Flex>
    </template>
  </Flex>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue';
import { Button, Dialog, Drawer } from 'primevue';
import { ADD_PERSON, ADD_TRANSACTION, assert, CLOSE_REASON_GROUP_NOT_FOUND, dateEquals, DELETE_TRANSACTION, UPDATE_TRANSACTION, type Person, type Transaction } from 'moneysplit-common';
import { type Driver } from '@/driver';
import { localUserName } from '@/localStorage';
import { icon_add_notes, icon_chevron_left, icon_cloud_off, icon_more_horiz, icon_person_add } from '@/assets/symbols';
import Flex from '@/ui/Flex.vue';
import Icon from '@/ui/Icon.vue';
import TransactionItem from '@/ui/TransactionItem.vue';
import TransactionEditor from '@/ui/TransactionEditor.vue';
import JoinForm from '@/ui/JoinForm.vue';
import GroupDetails from './GroupDetails.vue';

const props = defineProps<{
  driver: Driver;
}>();

const emit = defineEmits<{
  close: [];
}>();

const group = computed(() => props.driver.state.group);

const localUser = computed(() => {
  return group.value?.people.find(p => p.name === localUserName.value);
});

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
const editTransaction = ref<Transaction>();

const sortedTransactions = computed(() => {
  return group.value?.transactions
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
});

const schedule = computed(() => {
  const list = sortedTransactions.value;
  if (!list?.length) return [];

  let group = {
    date: list[0]!.date,
    entries: [] as Transaction[],
  };

  const groups = [group];

  for (const transaction of list ?? []) {
    if (!dateEquals(group.date, transaction.date)) {
      groups.push(group = {
        date: transaction.date,
        entries: [],
      });
    }

    group.entries.push(transaction);
  }

  return groups;
});

function createTransaction(transaction: Transaction | null) {
  if (transaction) {
    props.driver.apply(ADD_TRANSACTION, transaction);
    newTransaction.value = false;
  }
}

function saveTransaction(transaction: Transaction | null) {
  assert(editTransaction.value !== undefined, 'invalid save transaction');

  if (!transaction) {
    props.driver.apply(DELETE_TRANSACTION, editTransaction.value.id);
  } else {
    assert(transaction.id === editTransaction.value.id, 'invalid save transaction 2')
    props.driver.apply(UPDATE_TRANSACTION, transaction);
  }

  editTransaction.value = undefined;
}


const showJoinButton = computed(() => !localUser.value);
const addingPerson = shallowRef(false);

function joinGroup() {
    addingPerson.value = true;
}

function addPerson(newPerson: Person) {
  props.driver.apply(ADD_PERSON, newPerson);
  localUserName.value = newPerson.name;

  addingPerson.value = false;
}

function associatePerson(person: Person) {
  localUserName.value = person.name;

  addingPerson.value = false;
}
</script>

<style scoped lang="scss">
$syncDuration: 4000ms;

@keyframes sync {
  0% {
    left: -25%;
    right: 100%
  }

  62.5% {
    left: 100%;
    right: -25%
  }
}

.sync-bar {
  height: 0.25rem;
  overflow: hidden;

  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--p-content-border-color);

  > span {
    display: inline-block;
    height: 100%;
    background-color: var(--p-text-muted-color);
    position: absolute;
    animation: $syncDuration sync infinite linear;
  }

  > span:nth-child(2) {
    animation-delay: calc($syncDuration * 0.5);
  }
}

.group-view {
  width: 100%;
  min-height: 100svh;
  height: 100svh;
}

.header {
  position: relative;
  border-bottom: 1px solid var(--p-content-border-color);

  &.no-border {
    border-color: transparent;
  }
}

.group-title {
  font-size: 1.5rem;
  font-weight: 700;
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

.button-container {
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  right: 2rem;
  pointer-events: none;

  > button {
    pointer-events: all;
    box-shadow: 0 0 1rem var(--p-content-background), 0 0 1rem var(--p-content-background), 0 0 1rem var(--p-content-background), 0 0 1rem var(--p-content-background);
  }
}
</style>
