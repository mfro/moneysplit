<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
import { type Driver, OfflineDriver, WebSocketDriver } from '../driver';
import Flex from '../ui/Flex.vue';
import { knownGroups, localUserName, type KnownGroup } from '@/localStorage';
import { Button, InputText } from 'primevue';
import Icon from '@/ui/Icon.vue';
import { icon_add, icon_delete, icon_more_horiz, icon_visibility, icon_visibility_off } from '@/assets/icons';
import { assert } from '../../../moneysplit-common';

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
function removeKnownGroup(group: KnownGroup) {
  const index = knownGroups.indexOf(group);
  assert(index != -1, 'invalid removeKnownGroup');

  knownGroups.splice(index, 1);
}
</script>

<template>
  <Flex column class="landing-content py-6">
    <Flex column align-center>
      <h1 class="landing-title mb-2">Money<span>Split</span></h1>

      <InputText class="mb-6" v-model="localUserName" id="localUserName"
                 placeholder="Put your name here" />
    </Flex>

    <Flex class="px-4 py-2" align-center>
      <h3>Your Groups</h3>

      <Flex grow />

      <Button size="small" variant="text" rounded icon="yes"
              @click="isEditing = !isEditing">
        <Icon :src="icon_more_horiz" />
      </Button>
    </Flex>

    <Flex column class="gap-2">
      <template v-for="group in knownGroups">
        <template v-if="isEditing || !group.hidden">
          <Flex align-center class="known-group"
                :class="{ editing: isEditing }"
                @click="!isEditing && joinGroup(group.token)">

            <Flex grow align-center
                  @click="isEditing && (group.hidden = !group.hidden)">
              <template v-if="isEditing">
                <Icon :src="icon_visibility_off" class="mr-2"
                      v-if="group.hidden" />
                <Icon :src="icon_visibility" class="mr-2" v-else />
              </template>

              <span>{{ group.name }}</span>
            </Flex>

            <template v-if="isEditing">
              <Button size="small" variant="text" rounded icon="yes"
                      severity="danger"
                      @click="removeKnownGroup(group)">
                <Icon :src="icon_delete" />
              </Button>
            </template>
          </Flex>
        </template>
      </template>

      <Button @click="createGroup" style="align-self: center" class="mt-4">
        <Icon :src="icon_add" />
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
  cursor: pointer;
  height: 2.25rem;
  user-select: none;
  margin: 0 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);

  &:not(.editing) {
    &:hover {
      background-color: var(--p-primary-200);
    }

    &:active {
      background-color: var(--p-primary-300);
    }
  }
}
</style>
