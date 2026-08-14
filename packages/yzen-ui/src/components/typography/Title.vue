<script setup lang="ts">
import { computed } from 'vue'

interface TitleProps {
  level?: 1 | 2 | 3 | 4
}

const props = withDefaults(defineProps<TitleProps>(), { level: 1 })

const tag = computed(() => `h${props.level}` as const)
</script>

<template>
  <component :is="tag" class="yz-title" :class="`yz-title--${level}`"><slot /></component>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.yz-title {
  font-family: $yz-font-sans;
  font-weight: var(--yz-font-weight-semibold);
  color: $yz-ink;
  margin: 0;

  &--1 { font-size: $yz-font-size-lg; line-height: var(--yz-line-height-tight); }
  &--2 { font-size: 20px; line-height: var(--yz-line-height-tight); }
  &--3 { font-size: $yz-font-size-md; line-height: var(--yz-line-height-tight); }
  &--4 { font-size: $yz-font-size-sm; line-height: $yz-line-height-normal; }
}
</style>
