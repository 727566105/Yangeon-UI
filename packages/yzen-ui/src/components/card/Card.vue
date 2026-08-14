<script setup lang="ts">
import { computed } from 'vue'

interface CardProps {
  variant?: 'default' | 'glass' | 'gradient'
  hoverable?: boolean
  padded?: boolean
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  hoverable: false,
  padded: true,
})

const classes = computed(() => [
  'yz-card',
  `yz-card--${props.variant}`,
  { 'yz-card--hoverable': props.hoverable },
  { 'yz-card--padded': props.padded },
])
</script>

<template>
  <div :class="classes">
    <div v-if="$slots.header" class="yz-card__header"><slot name="header" /></div>
    <div class="yz-card__body"><slot /></div>
    <div v-if="$slots.footer" class="yz-card__footer"><slot name="footer" /></div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.yz-card {
  border-radius: $yz-radius-card;
  transition:
    box-shadow $yz-duration $yz-ease-out-strong,
    transform $yz-duration $yz-ease-out-strong,
    border-color $yz-duration $yz-ease-out-strong;

  &--default {
    background: $yz-surface;
    box-shadow: $yz-shadow-card;
  }

  &--glass {
    background: var(--yz-glass-bg, rgba(255, 255, 255, 0.7));
    backdrop-filter: blur(var(--yz-glass-blur, 12px));
    -webkit-backdrop-filter: blur(var(--yz-glass-blur, 12px));
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: $yz-shadow-card;
  }

  &--gradient {
    background: linear-gradient(135deg, var(--yz-accent-tint), transparent 60%);
    border: 1px solid var(--yz-line);
    box-shadow: $yz-shadow-card;
  }

  &--hoverable:hover {
    box-shadow: $yz-shadow-raised;
    transform: translateY(-2px);
  }

  &--padded { padding: 20px; }
}

.yz-card__header {
  padding-bottom: 14px;
  border-bottom: 1px solid var(--yz-line);
  margin-bottom: 14px;
}

.yz-card__footer {
  padding-top: 14px;
  border-top: 1px solid var(--yz-line);
  margin-top: 14px;
}
</style>
