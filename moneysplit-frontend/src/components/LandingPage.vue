<script setup lang="ts">
import { onMounted } from 'vue';
import { Driver } from '../driver';
import Flex from '../ui/Flex.vue';

const emit = defineEmits<{
  connect: [driver: Driver];
}>();

function createGroup() {
  emit('connect', Driver.connect('/connect'));
}

onMounted(() => {
  const token = new URL(location.href).searchParams.get('token');
  if (token) {
    emit('connect', Driver.connect(`/connect?token=${encodeURIComponent(token)}`));
  }
});
</script>

<template>
  <Flex grow align-center justify-center class="pa-6">
    <Flex column align-center class="landing-content">
      <h1 class="landing-title mb-2">Money<span>Split</span></h1>
      <p class="landing-subtitle mb-6">Split expenses with friends, effortlessly.</p>

      <div class="card landing-card">
        <h2 class="mb-1">Create a Group</h2>
        <p class="mb-4">Start a new group to begin tracking shared expenses.</p>

        <button class="btn btn-primary" @click="createGroup"
                id="create-group-btn">
          Create Group
        </button>
      </div>
    </Flex>
  </Flex>
</template>

<style scoped lang="scss">
.landing-content {
  text-align: center;
  max-width: 400px;
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

.landing-card {
  text-align: left;

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
}
</style>
