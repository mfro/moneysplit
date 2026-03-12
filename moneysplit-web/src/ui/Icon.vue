<template>
  <span class="icon" v-html="src" />
</template>

<script setup lang="ts">
const props = defineProps<{
  src: string,
}>();
</script>

<style lang="scss">
.icon {
  line-height: 0;

  svg {
    width: 1.5rem;
    height: 1.5rem;
    fill: currentColor;
  }
}
</style>
