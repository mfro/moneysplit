<script setup lang="ts">
import { onMounted } from 'vue';
import { type Driver, OfflineDriver, WebSocketDriver } from '../driver';
import Flex from '../ui/Flex.vue';
import { knownGroups, localUserName } from '@/localStorage';
import { Button, Card, InputText } from 'primevue';

const emit = defineEmits<{
  connect: [driver: Driver];
}>();

function createOfflineGroup() {
  emit('connect', new OfflineDriver());
}

function createGroup() {
  emit('connect', WebSocketDriver.connect('connect'));
}

function joinGroup(token: string) {
  if (token == 'offline') {
    emit('connect', new OfflineDriver());
  } else {
    emit('connect', WebSocketDriver.connect(`connect?token=${encodeURIComponent(token)}`));
  }
}

onMounted(() => {
  const token = new URL(location.href).searchParams.get('token');
  if (token) joinGroup(token);
});
</script>

<template>
    <Flex column align-center class="landing-content py-6">
      <h1 class="landing-title mb-2">Money<span>Split</span></h1>
      <p class="landing-subtitle mb-6">Split expenses with friends,
        effortlessly.</p>

      <InputText class="mb-6" v-model="localUserName" id="localUserName" />

      <Card class="minimal-card" v-if="knownGroups?.length"
            style="overflow: hidden">
        <template #title>
          Your Groups
        </template>

        <template #content>
          <Flex column class="gap-2">
            <template v-for="group in knownGroups">
              <Flex class="known-group" @click="joinGroup(group.token)">
                <span>{{ group.name }}</span>
              </Flex>
            </template>

            <Button @click="createGroup" style="align-self: center" class="mt-4">
              <i class="material-symbols-outlined">add</i>
              New Group
            </Button>
          </Flex>
        </template>
      </Card>
  </Flex>
</template>

<style scoped lang="scss">
.landing-content {
  width: 100%;
}

.landing-title {
  font-size: 2.5rem;
  font-weight: 700;

  span {
    color: var(--p-blue-500);
  }
}

.landing-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.known-group {
  cursor: pointer;
  padding: 10px 48px;
  margin: 0 -48px;
  user-select: none;

  &:hover {
    background-color: var(--p-button-text-secondary-hover-background);
  }

  &:active {
    background-color: var(--p-button-text-secondary-active-background);
  }
}
</style>
