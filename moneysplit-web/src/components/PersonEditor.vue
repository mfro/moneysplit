<template>
  <Flex column class="gap-2 mb-2">
    <InputText placeholder="Member Name" v-model="memberName" />
  </Flex>

  <Flex>
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
import { canAddPerson, canDeletePerson, canUpdatePerson, type Person } from '../../../moneysplit-common';
import { icon_delete, icon_save } from '@/assets/icons';
import type { Driver } from '@/driver';
import Flex from '@/ui/Flex.vue';
import Icon from '@/ui/Icon.vue';

const props = defineProps<{
  driver: Driver,
  modelValue: Person | null,
}>();

const emit = defineEmits<{
  'update:modelValue': [Person | null],
}>();

const group = computed(() => props.driver.state.data!);

const memberName = shallowRef(props.modelValue?.name ?? '')

const preview = computed<Person | null>(() => {
  return {
    id: props.modelValue?.id ?? props.driver.state.data!.nextId,
    name: memberName.value,
  }
});

const canSave = computed(() => {
  if (!preview.value) return false;

  if (props.modelValue) {
    return canUpdatePerson(group.value, preview.value);
  } else {
    return canAddPerson(group.value, memberName.value);
  }
});
</script>

<style scoped lang="scss"></style>
