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
  vertical-align: center;

  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
}
</style>
