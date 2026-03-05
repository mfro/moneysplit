<script setup lang="ts">
import { Driver } from '../driver';
import Flex from '../ui/Flex.vue';
import { REMOVE_PERSON, type Group } from '../../../moneysplit-common';

const props = defineProps<{
  driver: Driver;
  group: Group;
}>();


function removePerson(index: number) {
  props.driver.apply(REMOVE_PERSON, index);
}
</script>

<template>
  <div class="card">
    <Flex row align-center justify-space-between class="mb-4">
      <h3 class="panel-title">People</h3>
      <span class="count">{{ group.people.length }}</span>
    </Flex>


    <Flex column class="gap-1" v-if="group.people.length">
      <Flex row align-center class="gap-2 person-item"
            v-for="(person, i) in group.people" :key="i">
        <span class="person-name">{{ person.name }}</span>
        <button
                class="btn btn-danger btn-sm person-remove"
                @click="removePerson(i)"
                :id="`remove-person-${i}`">
          Remove
        </button>
      </Flex>
    </Flex>

    <p v-else class="empty-state py-4">No people added yet.</p>
  </div>
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

.person-item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  transition: background var(--transition);

  &:hover {
    background: var(--bg-hover);
  }

  .person-remove {
    margin-left: auto;
    opacity: 0;
    transition: opacity var(--transition);
  }

  &:hover .person-remove {
    opacity: 1;
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
