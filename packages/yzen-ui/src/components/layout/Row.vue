<script setup lang="ts">
import { computed } from 'vue'

interface RowProps {
  gutter?: number | [number, number]
}

const props = withDefaults(defineProps<RowProps>(), { gutter: 0 })

const gapStyle = computed(() => {
  if (Array.isArray(props.gutter)) {
    return `${props.gutter[0]}px ${props.gutter[1]}px`
  }
  return `${props.gutter}px`
})
</script>

<template>
  <div class="yz-row" :style="{ gap: gapStyle }"><slot /></div>
</template>

<style scoped lang="scss">
.yz-row {
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
}
</style>
