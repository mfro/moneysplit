<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { Driver } from '../driver';
import { RENAME_GROUP } from '../../../moneysplit-common';
import Flex from '../ui/Flex.vue';
import PeoplePanel from './PeoplePanel.vue';
import TransactionPanel from './TransactionPanel.vue';
import SettlementSummary from './SettlementSummary.vue';

const props = defineProps<{
  driver: Driver;
}>();

const group = computed(() => props.driver.state.data);

const isEditingName = ref(false);
const editName = ref('');

function startEditName() {
  editName.value = group.value?.name ?? '';
  isEditingName.value = true;
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
  <Flex column grow class="group-view" v-if="group">
    <header class="mb-5">
      <Flex row align-center class="gap-2" v-if="!isEditingName">
        <h1 class="group-title">{{ group.name }}</h1>
        <button class="btn-icon" @click="startEditName" title="Rename group"
                id="rename-group-btn">
          ✏️
        </button>
      </Flex>
      <Flex row align-center class="gap-2" v-else
            :is="'form'" @submit.prevent="saveName">
        <input
               v-model="editName"
               class="input group-name-input"
               autofocus
               @keydown.escape="cancelEditName"
               id="group-name-edit-input" />
        <button type="submit" class="btn btn-primary btn-sm"
                id="save-name-btn">Save</button>
        <button type="button" class="btn btn-ghost btn-sm"
                @click="cancelEditName" id="cancel-name-btn">Cancel</button>
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
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 24px;
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
