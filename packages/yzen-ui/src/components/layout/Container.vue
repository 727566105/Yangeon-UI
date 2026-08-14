<script setup lang="ts">
import { computed } from 'vue'

interface ContainerProps {
  fluid?: boolean
}

const props = withDefaults(defineProps<ContainerProps>(), { fluid: false })
const classes = computed(() => [
  'yz-container',
  props.fluid ? 'yz-container--fluid' : 'yz-container--fixed',
])
</script>

<template>
  <div :class="classes"><slot /></div>
</template>

<style scoped lang="scss">
.yz-container {
  margin-inline: auto;
  padding-inline: 24px;

  &--fixed { max-width: 72rem; }
  &--fluid { max-width: 100%; }
}
</style>
