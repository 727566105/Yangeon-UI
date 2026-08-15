<script setup lang="ts">
import { useI18n } from '../i18n'

// 显示变体：由父级从 registry 双语 label 计算好当前语言的显示文本（id + label + props）
interface DisplayVariant {
  id: string
  label: string
  props: Record<string, unknown>
}

defineProps<{ variants: DisplayVariant[]; modelValue: number }>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()
const { t } = useI18n()
</script>

<template>
  <div class="variant-switcher" role="tablist" :aria-label="t('switcher.aria')">
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
/* 对齐 beautifului：预览内底部居中胶囊 —— rounded-full bg-field p-0.5，激活项 bg-surface + shadow */
.variant-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 99px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.variant-switcher__item {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-2);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong), box-shadow 150ms var(--yz-ease-out-strong);
}
.variant-switcher__item:hover { color: var(--yz-ink); }
.variant-switcher__item--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
}
</style>
