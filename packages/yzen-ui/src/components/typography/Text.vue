<script setup lang="ts">
import { computed } from 'vue'

interface TextProps {
  type?: 'default' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'accent'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  weight?: 400 | 500 | 600
  mono?: boolean
  ellipsis?: boolean
  tag?: string
}

const props = withDefaults(defineProps<TextProps>(), {
  type: 'default',
  size: 'sm',
  weight: 400,
  mono: false,
  ellipsis: false,
  tag: 'span',
})

const classes = computed(() => [
  'yz-text',
  `yz-text--${props.type}`,
  `yz-text--${props.size}`,
  `yz-text--w${props.weight}`,
  { 'yz-text--mono': props.mono },
  { 'yz-text--ellipsis': props.ellipsis },
])
</script>

<template>
  <component :is="tag" :class="classes"><slot /></component>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.yz-text {
  font-family: $yz-font-sans;

  &--xs { font-size: $yz-font-size-xs; }
  &--sm { font-size: $yz-font-size-sm; }
  &--md { font-size: $yz-font-size-md; }
  &--lg { font-size: $yz-font-size-lg; line-height: var(--yz-line-height-tight); }

  &--w400 { font-weight: var(--yz-font-weight-normal); }
  &--w500 { font-weight: var(--yz-font-weight-medium); }
  &--w600 { font-weight: var(--yz-font-weight-semibold); }

  &--default { color: $yz-ink; }
  &--secondary { color: $yz-ink-2; }
  &--tertiary { color: $yz-ink-3; }
  &--success { color: $yz-green; }
  &--warning { color: $yz-orange; }
  &--danger { color: $yz-red; }
  &--accent { color: $yz-accent; }

  &--mono { font-family: $yz-font-mono; }

  &--ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
