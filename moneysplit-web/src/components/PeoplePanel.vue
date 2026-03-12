<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Button, Dialog } from 'primevue';
import { toDataURL } from 'qrcode';
import { type Driver } from '../driver';
import Flex from '../ui/Flex.vue';
import { ADD_PERSON, canRemovePerson, computeSplit, delay, DELETE_PERSON, zip, type Group, type Person } from '../../../moneysplit-common';
import { localUserName } from '@/localStorage';
import Balance from '@/ui/Balance.vue';
import Icon from '@/ui/Icon.vue';
import { icon_check, icon_copy_all, icon_delete, icon_group_add, icon_person_add } from '@/assets/icons';

const props = defineProps<{
  driver: Driver;
  group: Group;
}>();

const localUser = computed(() => {
  return props.group.people.find(p => p.name == localUserName.value);
});

const showJoinButton = computed(() =>
  localUserName.value
  && !localUser.value
);
function joinGroup() {
  const name = localUserName.value!;
  props.driver.apply(ADD_PERSON, { name });
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

    const split = computeSplit(transaction.cost, transaction.split);
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

        <Button v-if="canRemovePerson(group, person.id)"
                icon="yes" rounded variant="text" size="small"
                severity="danger"
                @click="removePerson(person)">
          <Icon :src="icon_delete" />
        </Button>
      </Flex>

      <p v-if="!group.people.length" class="empty-state my-4">
        No members yet
      </p>
    </Flex>

    <Flex class="gap-2" style="align-self: center">
      <Button @click="showShareDialog()">
        <Icon :src="icon_group_add" />
        Invite
      </Button>

      <template v-if="showJoinButton">
        <Button @click="joinGroup()">
          <Icon :src="icon_person_add" />
          Join
        </Button>
      </template>
    </Flex>

    <Dialog modal dismissableMask header="Group Invite" :visible="!!qrCode"
            @update:visible="qrCode = undefined">

      <Flex column align-center class="gap-4">
        <img :src="qrCode" />

        <Button @click="copyShareLink()">
          <Icon :src="icon_check" v-if="copySuccessful" />
          <Icon :src="icon_copy_all" v-else />
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
