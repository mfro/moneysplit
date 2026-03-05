<script setup lang="ts">
import { shallowRef } from 'vue';
import { Driver } from './driver';
import Flex from './ui/Flex.vue';
import LandingPage from './components/LandingPage.vue';
import GroupView from './components/GroupView.vue';

const driver = shallowRef<Driver | null>(null);

function onConnect(d: Driver) {
  driver.value = d;
}
</script>

<template>
  <Flex column class="app-shell">
    <LandingPage v-if="!driver" @connect="onConnect" />
    <GroupView v-else :driver="driver" />
  </Flex>
</template>

<style scoped lang="scss">
.app-shell {
  min-height: 100vh;
}
</style>
