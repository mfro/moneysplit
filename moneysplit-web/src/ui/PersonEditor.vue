<template>
  <Flex column class="gap-2">
    <label for="personName">
      {{ joining ? 'Enter your name' : 'Member name' }}
    </label>
    <InputText v-model="personName" id="personName"/>
  </Flex>

  <Flex class="mt-2">
    <template v-if="modelValue">
      <Button @click="emit('update:modelValue', null)"
              :disabled="!canDeletePerson(group, modelValue.id)"
              severity="danger">
        <Icon :src="icon_delete" />
        Delete
      </Button>
    </template>

    <Flex grow />

    <Button @click="emit('update:modelValue', preview)" :disabled="!canSave">
      <Icon :src="icon_save" />
      Save
    </Button>
  </Flex>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Button, InputText } from 'primevue';
import { canAddPerson, canDeletePerson, canUpdatePerson, type Person } from 'moneysplit-common';
import type { Driver } from '@/driver';
import { icon_delete, icon_save } from '@/assets/icons';
import Flex from '@/ui/Flex.vue';
import Icon from '@/ui/Icon.vue';

const props = defineProps<{
  driver: Driver,
  modelValue: Person | null,
  joining?: boolean,
}>();

const emit = defineEmits<{
  'update:modelValue': [Person | null],
}>();

const group = computed(() => props.driver.state.group!);

const personName = shallowRef(props.modelValue?.name ?? '')

const preview = computed<Person | null>(() => {
  return {
    id: props.modelValue?.id ?? props.driver.state.group!.nextId,
    name: personName.value.trim(),
  }
});

const canSave = computed(() => {
  if (!preview.value) return false;

  if (props.modelValue) {
    return canUpdatePerson(group.value, preview.value);
  } else {
    return canAddPerson(group.value, personName.value);
  }
});
</script>

<style scoped lang="scss"></style>
