<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { type Driver } from '../driver';
import { RENAME_GROUP } from '../../../moneysplit-common';
import Flex from '../ui/Flex.vue';
import PeoplePanel from './PeoplePanel.vue';
import TransactionPanel from './TransactionPanel.vue';
import { Button, InputText } from 'primevue';

const props = defineProps<{
  driver: Driver;
}>();

const emit = defineEmits<{
  close: [];
}>();

const group = computed(() => props.driver.state.data);

const isEditingName = ref(false);
const editName = ref('');

function close() {
  emit('close');
}

function startEditName() {
  editName.value = group.value?.name ?? '';
  isEditingName.value = true;

  document.getElementById('group-name-edit-input')?.focus();
}

function saveName() {
  const name = editName.value.trim();
  if (name && name !== group.value?.name) {
    props.driver.apply(RENAME_GROUP, name);
  }
  isEditingName.value = false;
}

function cancelEditName() {
  isEditingName.value = false;
}

watchEffect(() => {
  const token = props.driver.state.token;
  if (token) {
    const url = new URL(location.href);
    url.searchParams.set('token', token);
    history.replaceState(null, '', url);
  }
});
</script>

<template>
  <Flex column grow class="py-5 group-view" v-if="group">
    <header class="mb-5">
      <Flex row align-center class="gap-2 px-2" v-if="!isEditingName">
        <Button icon="yes" rounded variant="text" size="small"
                severity="secondary" @click="close">
          <span class="material-symbols-outlined">chevron_left</span>
        </Button>

        <h1 class="group-title">{{ group.name }}</h1>

        <Button icon="yes" rounded variant="text" size="small"
                severity="secondary" @click="startEditName">
          <span class="material-symbols-outlined">edit</span>
        </Button>
      </Flex>

      <Flex row align-center class="gap-2 px-2"
            :style="isEditingName ? {} : { 'opacity': 0, 'position': 'absolute', 'left': '-10000000px' }">

        <InputText v-model="editName" id="group-name-edit-input"/>

        <Button icon="yes" rounded variant="text" size="small"
                severity="primary" @click="saveName">
          <span class="material-symbols-outlined">save</span>
        </Button>

        <Button icon="yes" rounded variant="text" size="small"
                severity="secondary" @click="cancelEditName">
          <span class="material-symbols-outlined">cancel</span>
        </Button>
      </Flex>
    </header>

    <Flex column class="gap-5">
      <PeoplePanel :driver="driver" :group="group" />
      <TransactionPanel :driver="driver" :group="group" />
    </Flex>
  </Flex>

  <Flex grow align-center justify-center v-else>
    <p class="loading-text">Connecting…</p>
  </Flex>
</template>

<style scoped lang="scss">
.group-view {
  width: 100%;
}

.group-title {
  font-size: 1.75rem;
  font-weight: 700;
}

.group-name-input {
  max-width: 300px;
  font-size: 1.1rem;
}

.group-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  flex: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.loading-text {
  color: var(--text-secondary);
  font-size: 1.1rem;
}
</style>
