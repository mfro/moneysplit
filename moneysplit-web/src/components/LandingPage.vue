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
  emit('connect', WebSocketDriver.connect('/connect'));
}

function joinGroup(token: string) {
  if (token == 'offline') {
    emit('connect', new OfflineDriver());
  } else {
    emit('connect', WebSocketDriver.connect(`/connect?token=${encodeURIComponent(token)}`));
  }
}

onMounted(() => {
  const token = new URL(location.href).searchParams.get('token');
  if (token) joinGroup(token);
});
</script>

<template>
  <Flex grow align-center justify-center class="py-5">
    <Flex column align-center class="landing-content">
      <h1 class="landing-title mb-2">Money<span>Split</span></h1>
      <p class="landing-subtitle mb-6">Split expenses with friends,
        effortlessly.</p>

      <InputText class="mb-6" v-model="localUserName"/>

      <Card class="minimal-card">
        <template #title>Create a Group</template>

        <template #footer>
          <Flex justify-end class="gap-2">
            <Button @click="createOfflineGroup">
              Offline Group
            </Button>
            <Button @click="createGroup">
              New Group
            </Button>
          </Flex>
        </template>
      </Card>

      <Card class="minimal-card  mt-5" v-if="knownGroups?.length" style="overflow: hidden">
        <template #title>
          Your Groups
        </template>

        <template #content>
          <Flex column>
            <template v-for="group in knownGroups">
              <Flex class="known-group" @click="joinGroup(group.token)">
                <span>{{ group.name }}</span>
              </Flex>
            </template>
          </Flex>
        </template>
      </Card>
    </Flex>
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
    color: var(--accent);
  }
}

.landing-subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.minimal-card {
  width: 100%;
  border-radius: 0;
}

.landing-card {
  text-align: left;
  width: 100%;

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
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

.person-name {
  font-size: 0.9rem;
  font-weight: 500;
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}
</style>
