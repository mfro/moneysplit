<template>
  <Flex column class="gap-2" style="max-height: calc(100svh - 11rem); overflow: hidden;">
    <Flex column class="gap-2">
      <label for="groupName">Group name</label>

      <Flex style="position: relative">
        <InputText v-model="groupName" id="groupName" fluid />

        <Flex class="gap-2 px-2 edit-buttons"
              style="position: absolute; right: 0; top: 0; bottom: 0; align-items: center;"
              :class="{ visible: isGroupNameChanged }">
          <Button icon="yes" rounded variant="text" size="small"
                  severity="secondary"
                  @click="revertName">
            <Icon :src="icon_undo" />
          </Button>

          <Button icon="yes" rounded variant="text" size="small"
                  severity="primary"
                  @click="saveName"
                  :disabled="!isGroupNameSaveable">
            <Icon :src="icon_save" />
          </Button>
        </Flex>
      </Flex>
    </Flex>

    <PeoplePanel :driver="driver" :group="modelValue" />
  </Flex>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Button, InputText } from 'primevue';
import { RENAME_GROUP, type Group } from 'moneysplit-common';
import type { Driver } from '@/driver';
import { icon_save, icon_undo } from '@/assets/icons';
import Flex from '@/ui/Flex.vue';
import Icon from '@/ui/Icon.vue';
import PeoplePanel from './PeoplePanel.vue';

const props = defineProps<{
  driver: Driver,
  modelValue: Group,
}>();

const groupName = shallowRef(props.modelValue.name)

const isGroupNameChanged = computed(() => groupName.value !== props.modelValue.name);
const isGroupNameSaveable = computed(() => isGroupNameChanged.value && groupName.value.trim());

function saveName() {
  const name = groupName.value.trim();
  props.driver.apply(RENAME_GROUP, name);
}

function revertName() {
  groupName.value = props.modelValue.name;
}
</script>

<style scoped lang="scss">
.edit-buttons {
  opacity: 0;
  pointer-events: none;
  transition: opacity ease-in-out 200ms;

  &.visible {
    opacity: 1;
    pointer-events: all;
  }
}
</style>
