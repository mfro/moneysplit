<template>
  <Flex column class="gap-2" align-stretch style="overflow: hidden">
    <SelectButton :options="modes" v-model="mode" fluid :allow-empty="false" />

    <InputText v-model="label" inputId="label_input" fluid
               placeholder="Description" />

    <Flex class="gap-2" style="position: relative">
      <InputGroup style="width: calc(50% - 0.25rem)">
        <InputGroupAddon>
          <Icon :src="icon_event" style="margin: -100px 0" />
        </InputGroupAddon>

        <DatePicker v-model="date" showButtonBar />
      </InputGroup>

      <InputGroup style="width: calc(50% - 0.25rem)">
        <InputGroupAddon>
          <Icon :src="icon_attach_money" style="margin: -100px 0" />
        </InputGroupAddon>

        <InputText v-model="costRaw" inputId="price_input"
                   inputmode="decimal"
                   v-keyfilter.num
                   :placeholder="mode === 'Expense' ? 'Cost' : 'Amount'" />
      </InputGroup>
    </Flex>

    <template v-if="mode === 'Expense' || mode === 'Income'">
      <Flex column class="my-2"
            style="max-height: calc(100svh - 23rem); overflow-y: auto">
        <Flex row align-center justify-space-between class="gap-2"
              v-for="(person, i) in availablePeople">

          <Flex grow align-center class="participant gap-2"
                @click="payer = person">
            <Icon :src="icon_attach_money" class="payer-icon"
                  :class="{ active: person === payer }" />

            <Flex grow column class="gap-1">
              <span>{{ person.name }}</span>
              <span class="split-preview" v-if="getPreview(person.id)">
                {{ formatCost(getPreview(person.id)!) }}
              </span>
              <span class="split-preview" v-else>&nbsp;</span>
            </Flex>
          </Flex>

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
    </template>

    <template v-else>
      <Flex column class="gap-2 ma-2">
        <InputGroup style="flex: 1 0 0">
          <InputGroupAddon>
            <Icon :src="icon_person" style="margin: -100px 0" />
          </InputGroupAddon>

          <Select :options="props.driver.state.group!.people" optionLabel="name"
                  v-model="payer" />
        </InputGroup>

        <Flex justify-center>
          <Icon :src="icon_arrow_downward" />
        </Flex>

        <InputGroup style="flex: 1 0 0">
          <InputGroupAddon>
            <Icon :src="icon_person" style="margin: -100px 0" />
          </InputGroupAddon>

          <Select :options="props.driver.state.group!.people" optionLabel="name"
                  v-model="payee" />
        </InputGroup>
      </Flex>
    </template>

    <Flex row class="gap-2">
      <Button v-if="modelValue" @click="remove" severity="danger">
        <Icon :src="icon_delete" />
        Delete
      </Button>

      <Flex grow />

      <Button @click="save"
              :disabled="!preview || !isValidTransaction(preview)">
        <Icon :src="icon_save" />
        Save
      </Button>
    </Flex>
  </Flex>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watch, watchEffect } from 'vue';
import { Button, Checkbox, DatePicker, InputGroup, InputGroupAddon, InputNumber, InputText, KeyFilter as vKeyfilter, Select, SelectButton } from 'primevue';
import { clone, computeSplit, isValidTransaction, type RatioParticipant, type Transaction } from 'moneysplit-common';
import { formatCost } from '@/util';
import type { Driver } from '@/driver';
import { localUserName } from '@/localStorage';
import { icon_arrow_downward, icon_attach_money, icon_delete, icon_event, icon_person, icon_save } from '@/assets/icons';
import Flex from '@/ui/Flex.vue';
import Icon from '@/ui/Icon.vue';

const props = defineProps<{
  driver: Driver,
  modelValue: Transaction | null,
}>();

const emit = defineEmits<{
  'update:modelValue': [Transaction | null];
}>();

const group = computed(() => props.driver.state.group!);

const modes = [
  'Expense',
  'Income',
  'Payment',
];

const mode = shallowRef(
  props.modelValue?.type === 'exchange'
    ? 'Payment'
    : (props.modelValue?.cost ?? 0) < 0
      ? 'Income'
      : 'Expense'
)

function initCostRaw() {
  if (props.modelValue?.type === 'expense')
    return Math.abs(props.modelValue.cost / 100).toString();
  else if (props.modelValue?.type === 'exchange')
    return Math.abs(props.modelValue.value / 100).toString();
  else return '';
}

const costRaw = shallowRef(initCostRaw());
const cost = computed(() => {
  if (!/^\d+(\.\d{1,2})?$/.test(costRaw.value)) return null;
  const value = Math.round(parseFloat(costRaw.value) * 100);
  if (isNaN(value)) return null;
  return (mode.value === 'Income' ? -1 : 1) * value;
});

const label = ref(props.modelValue?.label ?? null);
const date = ref(props.modelValue?.date ?? new Date());
const payer = ref(
  group.value.people.find(p => p.id === props.modelValue?.payer)
  ?? group.value.people.find(p => p.name === localUserName.value)
  ?? null);

function initPayee() {
  if (props.modelValue?.type === 'exchange') {
    const v = props.modelValue;
    return group.value.people.find(p => p.id === v.payee)
      ?? group.value.people.find(p => p.name === localUserName.value)
      ?? null;
  } else {
    return null;
  }
}

const payee = ref(initPayee());

watch(() => [payer.value, payee.value] as const, (pair, oldPair) => {
  if (pair[0] === pair[1]) {
    if (pair[0] === oldPair[0]) {
      payer.value = oldPair[1];
    } else {
      payee.value = oldPair[0];
    }
  }
});

function initParticipants() {
  if (props.modelValue?.type === 'expense') {
    return clone(props.modelValue?.split.participants);
  }

  return group.value.people.map(person => ({
    person: person.id,
    ratio: 1,
  }));
}

const participants = ref<RatioParticipant[]>(initParticipants());

const availablePeople = computed(() => group.value.people);

const preview = computed<Transaction | null>(() => {
  if (mode.value === 'Expense' || mode.value === 'Income') {
    if (payer.value
      && cost.value
      && date.value
      && label.value
      && participants.value.length > 0) {
      return {
        type: 'expense',
        id: props.modelValue?.id ?? group.value.nextId,
        label: label.value,
        cost: cost.value,
        date: date.value,
        payer: payer.value.id,
        split: {
          type: 'ratio',
          participants: participants.value,
        },
      };
    }
  } else if (mode.value === 'Payment') {
    if (cost.value
      && date.value
      && payer.value
      && payee.value
      && participants.value.length > 0) {
      return {
        type: 'exchange',
        id: props.modelValue?.id ?? group.value.nextId,
        label: label.value || null,
        value: cost.value,
        date: date.value,
        payer: payer.value.id,
        payee: payee.value.id,
      };
    }
  }

  return null;
});

function getPreview(personId: number) {
  if (!cost.value || !participants.value.length) return;

  const index = participants.value.findIndex(p => p.person === personId);

  if (index === -1) {
    return null;
  } else {
    const splitPreview = computeSplit(cost.value, {
      type: 'ratio',
      participants: participants.value,
    });

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

watchEffect(() => {
  const zeros = participants.value.filter(p => !p.ratio);
  for (const p of zeros) toggleParticipant(p.person);
});

function save() {
  emit('update:modelValue', preview.value);
}

function remove() {
  emit('update:modelValue', null);
}
</script>

<style scoped lang="scss">
@use "@/common.scss" as *;

.split-preview {
  color: var(--text-secondary);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant {
  @include interactive-list-item;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);

  > .payer-icon {
    opacity: 0.25;

    &.active {
      opacity: 1;
    }
  }
}
</style>
