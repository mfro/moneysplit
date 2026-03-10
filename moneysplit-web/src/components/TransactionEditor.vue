<template>
  <Flex column class="gap-2" align-stretch>
    <InputText v-model="label" inputId="label_input" fluid
               placeholder="Label" />

    <Flex class="gap-2" style="position: relative">
      <Button style="width: calc(50% - 0.25rem)"
              variant="outlined"
              @click="isDebit = !isDebit">
        {{ isDebit ? 'Income' : 'Expense' }}
      </Button>

      <InputGroup style="width: calc(50% - 0.25rem)">
        <InputGroupAddon>
          <i class="material-symbols-outlined"
             style="margin: -1000px 0;">
            attach_money
          </i>
        </InputGroupAddon>

        <InputText v-model="costRaw" inputId="price_input"
                   inputmode="decimal"
                   placeholder="Cost"
                   v-keyfilter.num />
      </InputGroup>
    </Flex>

    <Flex class="gap-2">
      <InputGroup style="flex: 1 0 0">
        <InputGroupAddon>
          <i class="material-symbols-outlined"
             style="margin: -1000px 0">event</i>
        </InputGroupAddon>

        <DatePicker v-model="date" showButtonBar />
      </InputGroup>

      <InputGroup style="flex: 1 0 0">
        <InputGroupAddon>
          <i class="material-symbols-outlined"
             style="margin: -1000px 0">person</i>
        </InputGroupAddon>

        <Select :options="props.driver.state.data!.people" optionLabel="name"
                v-model="payer" />
      </InputGroup>
    </Flex>

    <Flex column class="gap-2 my-2" v-if="availablePeople.length"
          style="max-height: calc(100svh - 20rem); overflow-y: auto">
      <Flex row align-center justify-space-between class="gap-2"
            v-for="(person, i) in availablePeople">

        <Flex column class="gap-1">
          <span>{{ person.name }}</span>
          <span class="split-preview" v-if="getPreview(person.id)">{{
            formatCost(getPreview(person.id)!) }}</span>
          <span class="split-preview" v-else>&nbsp;</span>
        </Flex>

        <Flex grow />

        <InputGroup style="width: auto">
          <InputGroupAddon>
            <Checkbox binary :model-value="isParticipant(person.id)"
                      @update:model-value="toggleParticipant(person.id)" />
          </InputGroupAddon>

          <InputNumber :model-value="getParticipant(person.id)?.ratio ?? 0"
                       @input="e => getParticipant(person.id)!.ratio = (e.value as number)"
                       :disabled="!isParticipant(person.id)"
                       :max-fraction-digits="20"
                       style="max-width: 10ch" />
        </InputGroup>
      </Flex>
    </Flex>

    <Flex row class="gap-2">
      <Button v-if="modelValue" @click="remove"
              severity="danger">
        <i class="material-symbols-outlined">delete</i>
        Delete
      </Button>

      <Flex grow />

      <Button @click="save"
              :disabled="!preview">
        <i class="material-symbols-outlined">save</i>
        Save
      </Button>
    </Flex>
  </Flex>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef } from 'vue';
import Flex from '../ui/Flex.vue';
import { clone, computeSplit, type RatioParticipant, type Transaction } from '../../../moneysplit-common';
import { Button, Checkbox, DatePicker, InputGroup, InputGroupAddon, InputNumber, InputText, KeyFilter as vKeyfilter, Select } from 'primevue';
import type { Driver } from '@/driver';
import { formatCost } from '@/util';
import { localUserName } from '@/localStorage';

const props = defineProps<{
  driver: Driver,
  modelValue: Transaction | null,
}>();

const emit = defineEmits<{
  'update:modelValue': [Transaction | null];
}>();

function getLocalPayer() {
  return props.driver.state.data?.people.find(p => p.name == localUserName.value);
}

const costRaw = shallowRef(props.modelValue ? Math.abs(props.modelValue.cost / 100).toString() : '');
const isDebit = shallowRef(props.modelValue ? props.modelValue.cost < 0 : false);
const cost = computed(() => {
  if (!/^\d+(\.\d{1,2})?$/.test(costRaw.value)) return null;
  const value = Math.round(parseFloat(costRaw.value) * 100);
  if (isNaN(value)) return null;
  return (isDebit.value ? -1 : 1) * value;
});

const label = ref(props.modelValue?.label ?? null);
const date = ref(props.modelValue?.date ?? new Date());
const payer = ref(props.driver.state.data!.people.find(p => p.id == props.modelValue?.payer) ?? getLocalPayer() ?? null);
const participants = ref<RatioParticipant[]>(clone(props.modelValue?.split.participants ?? null) ?? props.driver.state.data!.people.map(person => ({
  person: person.id,
  ratio: 1,
})));

const availablePeople = computed(() => props.driver.state.data!.people);

const preview = computed<Transaction | null>(() => {
  if (payer.value !== null
    && cost.value
    && date.value
    && label.value
    && participants.value.length > 0) {
    return {
      label: label.value,
      cost: cost.value,
      date: date.value,
      payer: payer.value.id,
      split: {
        type: 'ratio',
        participants: participants.value,
      },
    };
  } else {
    return null;
  }
});

function getPreview(personId: number) {
  if (!cost.value || !participants.value.length) return;

  const index = participants.value.findIndex(p => p.person == personId);

  if (index == -1) {
    return null;
  } else {
    const transaction: Transaction = {
      label: '',
      cost: cost.value,
      date: new Date(),
      payer: participants.value[0]!.person,
      split: {
        type: 'ratio',
        participants: participants.value,
      },
    };

    const splitPreview = computeSplit(transaction);
    return splitPreview[index];
  }
}

function toggleParticipant(id: number) {
  const idx = participants.value.findIndex(p => p.person === id);
  if (idx >= 0) {
    participants.value.splice(idx, 1);
  } else {
    participants.value.push({ person: id, ratio: 1 });
  }
}

function isParticipant(id: number) {
  return participants.value.some(p => p.person === id);
}

function getParticipant(id: number) {
  return participants.value.find(p => p.person === id);
}

function save() {
  emit('update:modelValue', preview.value);
}

function remove() {
  emit('update:modelValue', null);
}
</script>

<style scoped lang="scss">
.split-preview {
  color: var(--text-secondary);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
