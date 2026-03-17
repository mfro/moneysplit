<template>
  <Flex column class="gap-2">

    <Flex column class="gap-2">
      <label for="personSelect">
        Select or enter your name
      </label>
      <Select :options="group.people" option-label="name" option-value="name"
              input-id="personSelect" editable v-model="personName" />
    </Flex>

    <Flex class="mt-2">
      <Flex grow />

      <Button @click="save()"
              :disabled="!canSave">
        <Icon :src="icon_save" />
        Save
      </Button>
    </Flex>

  </Flex>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Button, Select } from 'primevue';
import { assert, canAddPerson, type Person } from 'moneysplit-common';
import type { Driver } from '@/driver';
import { icon_save } from '@/assets/symbols';
import Flex from './Flex.vue';
import Icon from './Icon.vue';

const props = defineProps<{
  driver: Driver,
}>();

const emit = defineEmits<{
  'add-person': [Person],
  'associate-person': [Person],
}>();

const group = computed(() => props.driver.state.group!);

const personName = shallowRef('')

const preview = computed<Person | null>(() => {
  return {
    id: props.driver.state.group!.nextId,
    name: personName.value.trim(),
  }
});

const canSave = computed(() => {
  const existing = group.value.people.find(p => p.name === personName.value);
  if (existing) {
    return true;
  } else {
    return preview.value !== null
      && canAddPerson(group.value, preview.value.name);
  }
});

function save() {
  const existing = group.value.people.find(p => p.name === personName.value);
  if (existing) {
    emit('associate-person', existing);
  } else {
    assert(preview.value !== null, 'invalid save');
    emit('add-person', preview.value);
  }
}
</script>

<style scoped lang="scss"></style>
