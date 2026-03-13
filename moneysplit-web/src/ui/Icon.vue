<template>
  <span class="mfro-icon" v-html="src" />
</template>

<script setup lang="ts">
const props = defineProps<{
  src: string,
}>();
</script>

<style lang="scss">
.mfro-icon {
  line-height: 0;

  svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }
}

.p-button > .mfro-icon {
  margin: -1rem 0;
}
</style>
