<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
import { type Driver, OfflineDriver, WebSocketDriver } from '../driver';
import Flex from '../ui/Flex.vue';
import { knownGroups, localUserName, removeKnownGroup, toggleKnownGroup } from '@/localStorage';
import { Button, InputText } from 'primevue';

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

const isEditing = shallowRef(false);
</script>

<template>
  <Flex column class="landing-content py-6">
    <Flex column align-center>
      <h1 class="landing-title mb-2">Money<span>Split</span></h1>

      <InputText class="mb-6" v-model="localUserName" id="localUserName" placeholder="Put your name here" />
    </Flex>

    <Flex class="px-4 py-2" align-center>
      <h3>Your Groups</h3>

      <Flex grow />

      <Button size="small" variant="text" rounded icon="yes"
              @click="isEditing = !isEditing">
        <i class="material-symbols-outlined">more_horiz</i>
      </Button>
    </Flex>

    <Flex column class="gap-2">
      <template v-for="group in knownGroups">
        <template v-if="isEditing || !group.hidden">
          <Flex align-center class="known-group px-4"
                :class="{ editing: isEditing }"
                @click="!isEditing && joinGroup(group.token)">

            <Flex grow align-center @click="isEditing && toggleKnownGroup(group)">
              <template v-if="isEditing">
                 <i class="material-symbols-outlined mr-2" v-if="group.hidden">visibility_off</i>
                 <i class="material-symbols-outlined mr-2" v-else>visibility</i>
              </template>

              <span>{{ group.name }}</span>
            </Flex>

            <template v-if="isEditing">
              <Button size="small" variant="text" rounded icon="yes"
                      severity="danger"
                      @click="removeKnownGroup(group)">
                <i class="material-symbols-outlined">delete</i>
              </Button>
            </template>
          </Flex>
        </template>
      </template>

      <Button @click="createGroup" style="align-self: center" class="mt-4">
        <i class="material-symbols-outlined">add</i>
        New Group
      </Button>
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
    color: var(--p-blue-500);
  }
}

.landing-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.known-group {
  user-select: none;
  height: 2.25rem;

  &:not(.editing) {
    cursor: pointer;

    &:hover {
      background-color: var(--p-button-text-secondary-hover-background);
    }

    &:active {
      background-color: var(--p-button-text-secondary-active-background);
    }
  }
}
</style>
