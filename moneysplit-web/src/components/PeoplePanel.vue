<script setup lang="ts">
import { shallowRef, computed } from 'vue';
import { Button } from 'primevue';
import { type Driver } from '../driver';
import Flex from '../ui/Flex.vue';
import { ADD_PERSON, DELETE_PERSON, type Group, type Person } from '../../../moneysplit-common';
import { localUserName } from '@/localStorage';

const props = defineProps<{
  driver: Driver;
  group: Group;
}>();

const showJoinButton = computed(() =>
  localUserName.value
  && !props.group.people.find(p => p.name == localUserName.value)
);
function joinGroup() {
  const name = localUserName.value!;
  props.driver.apply(ADD_PERSON, { name });
}

const copySuccessful = shallowRef(false);
async function copyLink() {
  await navigator.clipboard.writeText(location.href);
  copySuccessful.value = true;
  await new Promise(resolve => setTimeout(resolve, 1000));
  copySuccessful.value = false
}

function canRemovePerson(person: Person) {
  return !props.group.transactions
    .some(t => t.payer == person.id || t.split.participants.some(p => p.person == person.id));
}

function removePerson(person: Person) {
  const index = props.group.people.indexOf(person);
  props.driver.apply(DELETE_PERSON, index);
}
</script>

<template>
  <Flex column class="gap-1">
    <Flex row align-center class="gap-2 pa-2"
          v-for="person in group.people">
      <span class="person-name">{{ person.name }}</span>

      <Flex grow />

      <Button v-if="canRemovePerson(person)"
              icon="yes" rounded variant="text" size="small"
              severity="danger"
              @click="removePerson(person)">
        <span class="material-symbols-outlined">delete</span>
      </Button>
    </Flex>

    <p v-if="!group.people.length" class="empty-state py-4">
      No members yet
    </p>
  </Flex>

  <Flex row class="gap-2">
    <Button @click="copyLink()">
      <i class="material-symbols-outlined" v-if="copySuccessful">check</i>
      <i class="material-symbols-outlined" v-else>copy_all</i>
      Share
    </Button>

    <Flex grow />

    <template v-if="showJoinButton">
      <Button @click="joinGroup()">
        <i class="material-symbols-outlined">group_add</i>
        Join
      </Button>
    </template>
  </Flex>
</template>

<style scoped lang="scss">
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
