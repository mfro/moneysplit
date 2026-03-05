<script setup lang="ts">
import { type Driver } from '../driver';
import Flex from '../ui/Flex.vue';
import { REMOVE_PERSON, type Group } from '../../../moneysplit-common';
import { Badge, Card } from 'primevue';

const props = defineProps<{
  driver: Driver;
  group: Group;
}>();


function removePerson(index: number) {
  props.driver.apply(REMOVE_PERSON, index);
}
</script>

<template>
  <Card class="minimal-card">
    <template #title>
      <Flex row align-center justify-space-between>
        <span>People</span>

        <Badge :value="group.people.length" />
      </Flex>
    </template>

    <template #content>
      <Flex column class="gap-1" v-if="group.people.length">
        <Flex row align-center class="gap-2 pa-2"
              v-for="(person, i) in group.people" :key="i">
          <span class="person-name">{{ person.name }}</span>

          <Flex grow />

          <!-- <Button icon="yes" rounded variant="text" size="small"
                  severity="danger" @click="removePerson(i)">
            <span class="material-symbols-outlined">delete</span>
          </Button> -->
        </Flex>
      </Flex>
      <p v-else class="empty-state py-4">No people added yet.</p>
    </template>
  </Card>
</template>

<style scoped lang="scss">
.panel-title {
  font-size: 1rem;
  font-weight: 600;
}

.count {
  background: var(--accent-subtle);
  color: var(--accent);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
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
