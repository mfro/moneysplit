<template>
  <span class="balance" :class="{ positive: value > 0, negative: value < 0 }">
    ${{ Math.abs(value / 100).toFixed(2) }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: number
}>();
</script>

<style scoped lang="scss">
.balance {
  font-weight: bold;

  &.positive {
    color: var(--positive-color);
  }

  &.negative {
    color: var(--negative-color);
  }
}
</style>
