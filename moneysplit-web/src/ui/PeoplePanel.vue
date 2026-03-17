<template>
  <Flex column class="gap-2" style="flex: 1 1 auto; overflow: hidden">
    <Flex column class="gap-1" style="overflow-y: auto">
      <Flex v-for="person in group.people"
            row align-center class="gap-2 pa-2 person"
            @click="editingPerson = person"
            @touchstart="() => { /* needed for mobile to show click effects */ }">
        <Flex column class="gap-1">
          <span>{{ person.name }}</span>
          <Balance class="balance-preview" :value="balances.get(person.id)!" />
        </Flex>
      </Flex>
    </Flex>

    <Flex class="gap-2" style="align-self: center">
      <Button @click="showShareDialog()">
        <Icon :src="icon_link" />
        Share
      </Button>

      <Button @click="addingPerson = true">
        <Icon :src="icon_person_add" />
        Add Member
      </Button>
    </Flex>

    <Dialog modal header="Add Member" v-model:visible="addingPerson"
            style="width: calc(100svw - 1.5rem)">

      <PersonEditor :driver="driver" :model-value="null"
                    @update:model-value="addPerson" />
    </Dialog>

    <Dialog modal header="Edit Member" :visible="editingPerson !== undefined"
            @update:visible="editingPerson = undefined"
            style="width: calc(100svw - 1.5rem)">

      <PersonEditor :driver="driver" :model-value="editingPerson ?? null"
                    @update:model-value="savePerson" />
    </Dialog>

    <Dialog modal dismissableMask header="Group Invite" :visible="qrCode !== undefined"
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

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { Button, Dialog } from 'primevue';
import { toDataURL } from 'qrcode';
import { ADD_PERSON, assert, computeBalances, delay, DELETE_PERSON, UPDATE_PERSON, type Group, type Person } from 'moneysplit-common';
import { type Driver } from '@/driver';
import { icon_check, icon_copy_all, icon_link, icon_person_add } from '@/assets/symbols';
import Flex from '@/ui/Flex.vue';
import Icon from '@/ui/Icon.vue';
import Balance from '@/ui/Balance.vue';
import PersonEditor from '@/ui/PersonEditor.vue';

const props = defineProps<{
  driver: Driver;
  group: Group;
}>();

const addingPerson = shallowRef(false);
const editingPerson = shallowRef<Person>();
function addPerson(person: Person | null) {
  if (person) {
    props.driver.apply(ADD_PERSON, person);
  }

  addingPerson.value = false;
}

function savePerson(person: Person | null) {
  assert(editingPerson.value !== undefined, 'invalid save transaction');

  if (person) {
    props.driver.apply(UPDATE_PERSON, person);
  } else {
    props.driver.apply(DELETE_PERSON, editingPerson.value.id);
  }

  editingPerson.value = undefined;
}

const balances = computed(() => computeBalances(props.group));

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

  const viewportWidth = Math.min(window.innerWidth, 40 * 16);
  const image = await toDataURL(location.href, {
    width: viewportWidth - fontSize * 4.5, // card padding is 1.25 on each side
    margin: 0,
  });

  qrCode.value = image;
}
</script>

<style scoped lang="scss">
@use "@/common.scss" as *;

.balance-preview {
  color: var(--text-secondary);
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person {
  @include interactive-list-item;
  padding: 0.5rem 0.5rem;
  border-radius: var(--p-border-radius-md);
}

img {
  border: 0.5rem solid white;
}
</style>
