<script setup lang="ts">
import { ref } from 'vue'
import { YzIcon } from 'yzen-ui'

const isDark = ref(document.documentElement.dataset.theme === 'dark')

function toggle() {
  isDark.value = !isDark.value
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
  localStorage.setItem('yz-theme', isDark.value ? 'dark' : 'light')
}
</script>

<template>
  <button class="theme-toggle" type="button" :aria-label="isDark ? '切换浅色' : '切换深色'" @click="toggle">
    <YzIcon :name="isDark ? 'eye-off' : 'eye'" :size="16" />
    <span class="theme-toggle__label">{{ isDark ? '深色' : '浅色' }}</span>
  </button>
</template>

<style scoped lang="scss">
@use '../../../../packages/yzen-ui/src/styles/variables.scss' as *;

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-family: var(--yz-font-sans);
  font-size: 13px;
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong);

  &:hover { background: var(--yz-hover); }
}
</style>
