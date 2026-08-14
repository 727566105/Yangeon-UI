<script setup lang="ts">
import { computed } from 'vue'

interface ButtonProps {
  type?: 'solid' | 'outline' | 'ghost' | 'glow'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  rounded?: boolean
  nativeType?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'solid',
  size: 'md',
  loading: false,
  disabled: false,
  block: false,
  rounded: false,
  nativeType: 'button',
})

const emit = defineEmits<{ (e: 'click', evt: MouseEvent): void }>()

const classes = computed(() => [
  'yz-button',
  `yz-button--${props.type}`,
  `yz-button--${props.size}`,
  { 'yz-button--block': props.block },
  { 'yz-button--rounded': props.rounded },
])

function handleClick(evt: MouseEvent) {
  if (props.disabled || props.loading) return
  emit('click', evt)
}
</script>

<template>
  <button :class="classes" :type="nativeType" :disabled="disabled || loading" @click="handleClick">
    <span v-if="loading" class="yz-button__spinner" aria-hidden="true" />
    <span v-if="$slots.icon" class="yz-button__icon"><slot name="icon" /></span>
    <span class="yz-button__label"><slot /></span>
  </button>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.yz-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: $yz-radius-control;
  font-family: $yz-font-sans;
  font-weight: var(--yz-font-weight-medium);
  cursor: pointer;
  transition:
    background-color $yz-duration $yz-ease-out-strong,
    border-color $yz-duration $yz-ease-out-strong,
    color $yz-duration $yz-ease-out-strong,
    box-shadow $yz-duration $yz-ease-out-strong,
    transform $yz-duration $yz-ease-out-strong;

  &--sm { height: 28px; padding: 0 10px; font-size: 12px; }
  &--md { height: 36px; padding: 0 14px; font-size: 14px; }
  &--lg { height: 44px; padding: 0 18px; font-size: 16px; }
  &--block { display: flex; width: 100%; }
  &--rounded { border-radius: $yz-radius-pill; }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:active:not(:disabled) {
    transform: translateY(1px);
  }
  &:focus-visible {
    outline: 2px solid $yz-accent;
    outline-offset: 2px;
  }

  // 类型变体
  &--solid {
    background: $yz-accent;
    color: #fff;
    &:hover:not(:disabled) { background: $yz-accent-ink; }
  }
  &--outline {
    background: $yz-surface;
    border-color: $yz-line-strong;
    color: $yz-ink;
    &:hover:not(:disabled) { background: var(--yz-hover); }
  }
  &--ghost {
    background: transparent;
    color: $yz-ink;
    &:hover:not(:disabled) { background: var(--yz-hover); }
  }
  // 发光（深色主题科技质感）
  &--glow {
    background: $yz-accent;
    color: #fff;
    &:hover:not(:disabled) { box-shadow: var(--yz-glow-accent, 0 0 0 1px rgba(2, 133, 255, 0.5), 0 0 16px rgba(2, 133, 255, 0.35)); }
  }
}

.yz-button__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: yz-spin 0.7s linear infinite;
}

@keyframes yz-spin {
  to { transform: rotate(360deg); }
}
</style>
