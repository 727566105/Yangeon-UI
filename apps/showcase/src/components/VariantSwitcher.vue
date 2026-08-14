<script setup lang="ts">
import type { Variant } from '../registry'

defineProps<{ variants: Variant[]; modelValue: number }>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()
</script>

<template>
  <div class="variant-switcher" role="tablist" aria-label="变体切换">
    <button
      v-for="(v, i) in variants"
      :key="v.label"
      type="button"
      class="variant-switcher__item"
      :class="{ 'variant-switcher__item--active': modelValue === i }"
      @click="$emit('update:modelValue', i)"
    >
      {{ v.label }}
    </button>
  </div>
</template>

<style scoped>
.variant-switcher {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border: 1px solid var(--yz-line);
  border-radius: 8px;
  background: var(--yz-canvas);
}
.variant-switcher__item {
  border: none;
  background: transparent;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-2);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.variant-switcher__item:hover { color: var(--yz-ink); }
.variant-switcher__item--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong);
}
</style>
