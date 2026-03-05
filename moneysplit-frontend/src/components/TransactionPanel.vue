<script setup lang="ts">
import { ref, computed } from 'vue';
import { type Driver } from '../driver';
import Flex from '../ui/Flex.vue';
import { ADD_TRANSACTION, REMOVE_TRANSACTION, type Group, type Transaction, type Person, ADD_PERSON } from '../../../moneysplit-common';
import { Button, Card, Dialog, InputNumber, InputText } from 'primevue';

const props = defineProps<{
  driver: Driver;
  group: Group;
}>();

const showForm = ref(false);
const cost = ref(0);
const participants = ref<{ person: Person; ratio: number }[]>([]);

const availablePeople = computed(() => props.group.people);

function openForm() {
  cost.value = 0;
  participants.value = props.group.people.map(p => ({ person: p, ratio: 1 }));
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
}

const newPersonName = ref('');

function toggleParticipant(person: Person) {
  const idx = participants.value.findIndex(p => p.person.name === person.name);
  if (idx >= 0) {
    participants.value.splice(idx, 1);
  } else {
    participants.value.push({ person, ratio: 1 });
  }
}

function isParticipant(person: Person) {
  return participants.value.some(p => p.person.name === person.name);
}

function getParticipant(person: Person) {
  return participants.value.find(p => p.person.name === person.name);
}

function addPerson() {
  const name = newPersonName.value.trim();
  if (!name) return;

  // Check if person already exists globally
  const existing = props.group.people.find(p => p.name === name);
  if (!existing) {
    // We add them to the global group; the server will assign them an index
    // The transaction will refer to them but since identity is currently
    // object ref, we need to be careful. The apply mechanism sends objects,
    // so we'll send the ADD_PERSON operation right now.
    props.driver.apply(ADD_PERSON, { name });
  }

  // Add to our local participants list
  const personInfo = existing || { name };
  if (!isParticipant(personInfo)) {
    participants.value.push({ person: personInfo, ratio: 1 });
  }

  newPersonName.value = '';
}

function addTransaction() {
  const amount = cost.value;
  if (isNaN(amount) || amount <= 0 || participants.value.length === 0) return;

  const transaction: Transaction = {
    cost: amount,
    split: {
      type: 'ratio',
      participants: participants.value.map(p => ({
        person: p.person,
        ratio: p.ratio,
      })),
    },
  };

  props.driver.apply(ADD_TRANSACTION, transaction);
  closeForm();
}

function removeTransaction(index: number) {
  props.driver.apply(REMOVE_TRANSACTION, index);
}

function formatCost(n: number) {
  return `$${n.toFixed(2)}`;
}

function splitSummary(transaction: Transaction) {
  const totalRatio = transaction.split.participants.reduce((s, p) => s + p.ratio, 0);
  return transaction.split.participants
    .map(p => {
      const share = (p.ratio / totalRatio) * transaction.cost;
      return `${p.person.name}: ${formatCost(share)}`;
    })
    .join(', ');
}
</script>

<template>
  <Card class="minimal-card">
    <template #title>
      <Flex row align-center justify-space-between class="mb-4">
        <span>Transactions</span>

        <Flex row align-center class="gap-2">
          <Button icon="yes" rounded variant="text" size="small"
                  @click="openForm">
            <span class="material-symbols-outlined">add</span>
          </Button>
        </Flex>
      </Flex>
    </template>

    <template #content>
      <!-- Transaction list -->
      <Flex column class="gap-1" v-if="group.transactions.length">
        <Flex row align-center justify-space-between
              class="gap-3 transaction-item"
              v-for="(tx, i) in group.transactions" :key="i">
          <Flex column class="transaction-info">
            <span class="transaction-cost">{{ formatCost(tx.cost) }}</span>
            <span class="transaction-split">{{ splitSummary(tx) }}</span>
          </Flex>

          <Button icon="yes" rounded variant="text" size="small"
                  severity="danger" @click="removeTransaction(i)">
            <span class="material-symbols-outlined">delete</span>
          </Button>
        </Flex>
      </Flex>

      <p v-else-if="!showForm" class="empty-state py-4">No transactions yet.</p>
    </template>
  </Card>

  <Dialog v-model:visible="showForm" modal header="Add Transaction">
    <Flex column class="gap-2">
      <Flex align-baseline>
        <label for="price_input" class="mx-2 mb-2">Total</label>
        <Flex grow />
        <InputNumber v-model="cost" inputId="price_input" fluid
                     style="width: 10ch" />
      </Flex>

      <Flex column class="gap-1" v-if="availablePeople.length">
        <Flex row align-center justify-space-between class="gap-2"
              v-for="(person, i) in availablePeople" :key="i">
          <label class="participant-toggle pa-3">
            <input type="checkbox" :checked="isParticipant(person)"
                   @change="toggleParticipant(person)" />

            <span>{{ person.name }}</span>
          </label>

          <InputNumber :model-value="getParticipant(person)?.ratio ?? 0"
                       @input="e => getParticipant(person)!.ratio = (e.value as number)"
                       :disabled="!isParticipant(person)" fluid
                       style="width: 8ch" />
        </Flex>
      </Flex>

      <Flex row class="gap-2" :is="'form'" @submit.prevent="addPerson">
        <InputText v-model="newPersonName" placeholder="Add a new group member"
                   id="add-tx-person-input" />
        <Button @click="addPerson" size="small" :disabled="!newPersonName">
          <span class="material-symbols-outlined">add</span>
        </button>
      </Flex>

      <Flex row class="gap-2 mt-4">
        <Flex grow />

        <Button @click="addTransaction"
                :disabled="!cost || participants.length === 0">
          Save Transaction
        </Button>
      </Flex>
    </Flex>
  </Dialog>
</template>

<style scoped lang="scss">
.panel-title {
  font-size: 1rem;
  font-weight: 600;
}

.count {
  background: var(--accent-subtle);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.transaction-form {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.participant-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;

  input[type="checkbox"] {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
  }
}

.ratio-input {
  width: 60px;
  text-align: center;
  padding: 4px 6px;
  font-size: 0.85rem;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.transaction-item {
  padding: 10px 12px;
  margin: 0 -12px;
}

.transaction-info {
  min-width: 0;
}

.transaction-cost {
  font-size: 1rem;
  font-weight: 600;
}

.transaction-split {
  font-size: 0.8rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}
</style>
