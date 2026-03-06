<script setup lang="ts">
import { shallowRef } from 'vue';
import { type Driver } from './driver';
import LandingPage from './components/LandingPage.vue';
import GroupView from './components/GroupView.vue';

const driver = shallowRef<Driver | null>(null);

function onConnect(d: Driver) {
  driver.value = d;
}

function onClose() {
  const url = new URL(location.href);
  url.searchParams.delete('token');
  history.replaceState(null, '', url);

  driver.value?.close();
  driver.value = null;
}
</script>

<template>
  <LandingPage v-if="!driver" @connect="onConnect" />
  <GroupView v-else :driver="driver" @close="onClose" />
</template>

<style scoped lang="scss"></style>
