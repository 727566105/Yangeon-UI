<script setup lang="ts">
import { CATEGORY_LABELS } from '../registry'
import { useGroups } from '../groups'

defineProps<{ activeKey: string | null }>()
const groupByCategory = useGroups()
</script>

<template>
  <nav class="site-nav">
    <div v-for="(entries, category) in groupByCategory" :key="category" class="site-nav__group">
      <p class="site-nav__label">{{ CATEGORY_LABELS[category] ?? category }}</p>
      <a
        v-for="e in entries"
        :key="e.key"
        class="site-nav__link"
        :class="{ 'site-nav__link--active': activeKey === e.key }"
        :href="`#section-${e.key}`"
      >
        <span class="site-nav__num">{{ String(e.order).padStart(2, '0') }}</span>
        {{ e.name }}
      </a>
    </div>
  </nav>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 65px;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 12px 0;
  width: 220px;
  flex-shrink: 0;
}
.site-nav__label {
  margin: 0;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--yz-ink-3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.site-nav__link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--yz-ink-2);
  text-decoration: none;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.site-nav__link:hover { background: var(--yz-hover); color: var(--yz-ink); }
.site-nav__link--active { background: var(--yz-accent-tint); color: var(--yz-accent-ink); }
.site-nav__num { font-family: var(--yz-font-mono); font-size: 11px; color: var(--yz-ink-3); }
</style>
