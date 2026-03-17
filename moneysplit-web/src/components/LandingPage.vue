<template>
  <Flex column class="landing-content py-6">
    <Flex column align-center>
      <h1 class="landing-title mb-2">
        Money<span>Split</span> <span>(beta)</span>
      </h1>

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
      <template v-for="[token, known] in allGroups">
        <template v-if="isEditing || !known.hidden">
          <Flex align-center class="known-group"
                :class="{ editing: isEditing }"
                @click="!isEditing && (token ? openToken(token) : openLocal(known))"
                @touchstart="() => { /* needed for mobile to show click effects */ }">

            <Flex grow align-center
                  @click="isEditing && (known.hidden = !known.hidden)">
              <template v-if="isEditing">
                <Icon :src="icon_visibility_off" class="mr-2"
                      v-if="known.hidden" />
                <Icon :src="icon_visibility" class="mr-2" v-else />
              </template>

              <span>{{ known.group.name }}</span>
            </Flex>
          </Flex>
        </template>
      </template>

      <Button @click="createGroup" style="align-self: center" class="mt-2">
        <Icon :src="icon_add" />
        New Group
      </Button>
    </Flex>

    <Flex grow />

    <div class="ma-4">
      <h4>
        Tips
      </h4>
      <p class="mt-2">
        This website works offline.
      </p>
      <p class="mt-2">
        Make sure to open it once you get back online to sync your changes.
      </p>
      <p class="mt-2">
        Make sure to open this in a browser, not an embedded browser
        within an app.
      </p>
    </div>

    <Flex justify-center>
      <a class="github" area-label="github" target="_blank"
         href="https://github.com/mfro/moneysplit"></a>
    </Flex>
  </Flex>
</template>

<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue';
import { Button, InputText } from 'primevue';
import { icon_add, icon_more_horiz, icon_visibility, icon_visibility_off } from '@/assets/symbols';
import { appState, localUserName, type OfflineGroup } from '@/localStorage';
import Icon from '@/ui/Icon.vue';
import { type Driver, WebSocketDriver } from '../driver';
import Flex from '../ui/Flex.vue';

type KnownGroup = [string | null, OfflineGroup];

const emit = defineEmits<{
  connect: [driver: Driver];
}>();

function createGroup() {
  emit('connect', WebSocketDriver.create());
}

function openToken(token: string) {
  emit('connect', WebSocketDriver.connectToken(token));
}

function openLocal(group: OfflineGroup) {
  emit('connect', WebSocketDriver.openLocal(group));
}

onMounted(() => {
  const token = new URL(location.href).searchParams.get('token');
  if (token) openToken(token);
});

const isEditing = shallowRef(false);

const allGroups = computed(() => {
  const list: KnownGroup[] = [
    ...appState.newGroups
      .map<KnownGroup>(group => [null, group]),

    ...Object.entries(appState.knownGroups),
  ];

  list.sort((a, b) => a[1].group.name.localeCompare(b[1].group.name));

  return list;
});
</script>

<style scoped lang="scss">
@use "@/common.scss" as *;

.landing-content {
  width: 100%;
}

.landing-title {
  font-size: 2.5rem;
  font-weight: 700;

  > span:first-child {
    color: var(--accent-color);
  }

  > span:last-child {
    font-size: 1rem;
    color: var(--text-muted);
  }
}

.known-group {
  height: 2.25rem;
  margin: 0 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);

  &:not(.editing) {
    @include interactive-list-item;
  }
}

.github {
  width: 1.6em;
  height: 1.6em;
  background-size: 1.5em;
  background-image: url("../assets/GitHub.svg");
  background-position: center;
  background-repeat: no-repeat;
  cursor: pointer;
}
</style>
