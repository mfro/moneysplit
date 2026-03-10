<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Button, Dialog } from 'primevue';
import { toDataURL } from 'qrcode';
import { type Driver } from '../driver';
import Flex from '../ui/Flex.vue';
import { ADD_PERSON, computeSplit, delay, DELETE_PERSON, zip, type Group, type Person } from '../../../moneysplit-common';
import { localUserName } from '@/localStorage';
import Balance from '@/ui/Balance.vue';

const props = defineProps<{
  driver: Driver;
  group: Group;
}>();

const localUser = computed(() => {
  return props.group.people.find(p => p.name == localUserName.value);
})

const showJoinButton = computed(() =>
  localUserName.value
  && !localUser.value
);
function joinGroup() {
  const name = localUserName.value!;
  props.driver.apply(ADD_PERSON, { name });
}

function canRemovePerson(person: Person) {
  return !props.group.transactions
    .some(t => t.payer == person.id || t.split.participants.some(p => p.person == person.id));
}

function removePerson(person: Person) {
  const index = props.group.people.indexOf(person);
  props.driver.apply(DELETE_PERSON, index);
}

const balances = computed(() => {
  const balances = new Map<number, number>();

  for (const person of props.group.people) {
    balances.set(person.id, 0);
  }

  for (const transaction of props.group.transactions) {
    balances.set(transaction.payer, balances.get(transaction.payer)! + transaction.cost);

    const split = computeSplit(transaction);
    for (const [participant, portion] of zip(transaction.split.participants, split)) {
      balances.set(participant.person, balances.get(participant.person)! - portion);
    }
  }

  return balances;
});

const copySuccessful = shallowRef(false);
async function copyShareLink() {
  await navigator.clipboard.writeText(location.href);
  copySuccessful.value = true;
  await delay(800);
  copySuccessful.value = false
}

const qrCode = shallowRef<string>();
async function showShareDialog() {
  const fontSize = parseFloat(getComputedStyle(document.body).fontSize);

  const image = await toDataURL(location.href, {
    width: window.innerWidth - fontSize * 3.5, // card padding is 1.25 on each side
    margin: 0,
  });

  qrCode.value = image;
}
</script>

<template>
  <Flex column class="gap-2">
    <Flex column class="gap-1">
      <Flex row align-center class="gap-2 pa-2"
            v-for="person in group.people">
        <Flex column class="gap-1">
          <span>{{ person.name }}</span>
          <Balance class="balance-preview" :value="balances.get(person.id)!" />
        </Flex>

        <Flex grow />

        <Button v-if="canRemovePerson(person)"
                icon="yes" rounded variant="text" size="small"
                severity="danger"
                @click="removePerson(person)">
          <span class="material-symbols-outlined">delete</span>
        </Button>
      </Flex>

      <p v-if="!group.people.length" class="empty-state my-4">
        No members yet
      </p>
    </Flex>

    <Flex class="gap-2" style="align-self: center">
      <Button @click="showShareDialog()">
        <span class="material-symbols-outlined">group_add</span>
        Invite
      </Button>

      <template v-if="showJoinButton">
        <Button @click="joinGroup()">
          <i class="material-symbols-outlined">person_add</i>
          Join
        </Button>
      </template>
    </Flex>

    <Dialog modal dismissableMask header="Group Invite" :visible="!!qrCode"
            @update:visible="qrCode = undefined">

      <Flex column align-center class="gap-4">
        <img :src="qrCode" />

        <Button @click="copyShareLink()">
          <i class="material-symbols-outlined" v-if="copySuccessful">check</i>
          <i class="material-symbols-outlined" v-else>copy_all</i>
          Copy Link
        </Button>
      </Flex>
    </Dialog>
  </Flex>
</template>

<style scoped lang="scss">
.balance-preview {
  color: var(--text-secondary);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
}
</style>
