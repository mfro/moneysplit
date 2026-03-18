<template>
  <Flex column class="gap-2">

    <Flex column class="gap-2">
      <label for="personSelect">
        Select your name
      </label>
      <Select :options="options"
              input-id="personSelect"
              v-model="joinPerson">

        <template #value="slot">
          <Flex v-if="slot.value == NEW_MEMBER" align-center class="gap-1">
            <Icon :src="icon_add" style="margin: -24px 0" /> New member
          </Flex>
          <span v-else-if="slot.value">
            {{ slot.value.name }}
          </span>
        </template>

        <template #option="slot">
          <Flex v-if="slot.option == NEW_MEMBER" align-center class="gap-1">
            <Icon :src="icon_add" style="margin: -24px 0" /> New member
          </Flex>
          <span v-else>
            {{ slot.option.name }}
          </span>
        </template>

      </Select>
    </Flex>

    <template v-if="joinPerson === NEW_MEMBER">
      <InputText v-model="localUserName"
                 id="localUserName" placeholder="Put your name here" />
    </template>

    <Flex class="mt-2">
      <Flex grow />

      <Button @click="save()" :disabled="!canSave">
        <Icon :src="icon_save" />
        Save
      </Button>
    </Flex>

  </Flex>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Button, InputText, Select } from 'primevue';
import { assert, canAddPerson, type Person } from 'moneysplit-common';
import { localUserName } from '@/localStorage';
import type { Driver } from '@/driver';
import { icon_save, icon_add } from '@/assets/symbols';
import Flex from './Flex.vue';
import Icon from './Icon.vue';

const props = defineProps<{
  driver: Driver,
}>();

const emit = defineEmits<{
  'add-person': [Person],
  'associate-person': [Person],
}>();

const NEW_MEMBER = 'new member';

const group = computed(() => props.driver.state.group!);

const options = computed(() => {
  return [
    ...group.value.people,
    NEW_MEMBER,
  ];
})

const joinPerson = shallowRef<Person | typeof NEW_MEMBER | null>(null);

const preview = computed<Person | null>(() => {
  const name = joinPerson.value === NEW_MEMBER
    ? localUserName.value
    : joinPerson.value?.name;
  if (!name) return null;

  return {
    id: props.driver.state.group!.nextId,
    name: name.trim(),
  }
});

const canSave = computed(() => {
  const existing = group.value.people.find(p => p.name === preview.value?.name);
  if (existing) {
    return true;
  } else {
    return preview.value !== null
      && canAddPerson(group.value, preview.value.name);
  }
});

function save() {
  const existing = group.value.people.find(p => p.name === preview.value?.name);
  if (existing) {
    emit('associate-person', existing);
  } else {
    assert(preview.value !== null, 'invalid save');
    emit('add-person', preview.value);
  }
}
</script>

<style scoped lang="scss"></style>
