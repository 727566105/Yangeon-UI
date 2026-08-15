<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '../i18n'
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

const props = defineProps<{ entries: RegistryEntry[]; categories: RegistryCategory[] }>()
defineEmits<{ (e: 'edit', key: string): void; (e: 'import'): void }>()

const { t, localized } = useI18n()

const search = ref('')
const category = ref('all')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return props.entries.filter((e) => {
    if (category.value !== 'all' && e.category !== category.value) return false
    if (!q) return true
    const hay = `${e.key} ${e.name.zh} ${e.name.en} ${e.tags.map((x) => x.zh + x.en).join(' ')}`.toLowerCase()
    return hay.includes(q)
  })
})

const categoryLabel = (key: string) => {
  const c = props.categories.find((x) => x.key === key)
  return c ? localized(c.label) : key
}
</script>

<template>
  <div class="list">
    <div class="list__toolbar">
      <input
        v-model="search"
        class="list__search"
        type="search"
        :placeholder="t('list.search')"
      />
      <select v-model="category" class="list__select" :aria-label="t('list.categoryAll')">
        <option value="all">{{ t('list.categoryAll') }}</option>
        <option v-for="c in categories" :key="c.key" :value="c.key">{{ localized(c.label) }}</option>
      </select>
      <button
        type="button"
        class="list__add"
        @click="$emit('import')"
      >+ {{ t('list.add') }}</button>
    </div>

    <div class="list__table-wrap">
      <table class="list__table">
        <thead>
          <tr>
            <th class="list__th list__th--num">#</th>
            <th class="list__th">{{ t('edit.name') }}</th>
            <th class="list__th">{{ t('edit.category') }}</th>
            <th class="list__th">{{ t('edit.tags') }}</th>
            <th class="list__th list__th--num">{{ t('list.variants') }}</th>
            <th class="list__th list__th--status">{{ t('list.visible') }}</th>
            <th class="list__th list__th--action" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in filtered" :key="e.key" class="list__row">
            <td class="list__td list__td--num">{{ String(e.order).padStart(2, '0') }}</td>
            <td class="list__td list__td--name">
              <code class="list__key">{{ e.key }}</code>
              <span class="list__name">{{ localized(e.name) }}</span>
            </td>
            <td class="list__td"><code class="list__key">{{ categoryLabel(e.category) }}</code></td>
            <td class="list__td">
              <span v-for="tag in e.tags" :key="tag.zh" class="list__tag">{{ localized(tag) }}</span>
            </td>
            <td class="list__td list__td--num">{{ e.variants.length }}</td>
            <td class="list__td list__td--status">
              <span
                class="list__dot"
                :class="{ 'list__dot--on': e.visible }"
                :title="e.visible ? t('list.visible') : t('list.hidden')"
              />
              <span v-if="!e.visible" class="list__hidden-badge">{{ t('list.hidden') }}</span>
            </td>
            <td class="list__td list__td--action">
              <button type="button" class="list__edit" @click="$emit('edit', e.key)">
                {{ t('list.edit') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="filtered.length === 0" class="list__empty">{{ t('list.empty') }}</p>
    </div>
  </div>
</template>

<style scoped>
.list__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.list__search {
  flex: 1;
  max-width: 320px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-size: 13px;
  outline: none;
  transition: box-shadow 150ms var(--yz-ease-out-strong), border-color 150ms var(--yz-ease-out-strong);
}
.list__search:focus {
  border-color: var(--yz-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--yz-accent) 20%, transparent);
}
.list__select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-size: 13px;
}
.list__add {
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: var(--yz-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 150ms var(--yz-ease-out-strong);
}
.list__add:active { transform: scale(0.97); }
.list__table-wrap {
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
  overflow: auto;
}
.list__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.list__th {
  padding: 10px 14px;
  text-align: left;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-3);
  border-bottom: 1px solid var(--yz-line);
  white-space: nowrap;
}
.list__th--num { width: 52px; }
.list__th--status { width: 80px; }
.list__th--action { width: 80px; }
.list__td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--yz-line);
  color: var(--yz-ink-2);
  vertical-align: middle;
}
.list__row:last-child .list__td { border-bottom: none; }
.list__row:hover { background: var(--yz-hover); }
.list__td--num {
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-3);
  font-variant-numeric: tabular-nums;
}
.list__td--name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.list__key {
  font-family: var(--yz-font-mono);
  font-size: 11px;
  color: var(--yz-ink-3);
}
.list__name { font-weight: 500; color: var(--yz-ink); }
.list__tag {
  display: inline-block;
  margin-right: 4px;
  padding: 1px 7px;
  border-radius: 99px;
  background: var(--yz-field);
  font-size: 11px;
  color: var(--yz-ink-2);
  white-space: nowrap;
}
.list__dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: var(--yz-ink-3);
}
.list__dot--on { background: var(--yz-green); }
.list__hidden-badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 99px;
  background: var(--yz-field);
  font-size: 11px;
  color: var(--yz-ink-3);
  white-space: nowrap;
}
.list__edit {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: var(--yz-radius-control);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--yz-accent);
  cursor: pointer;
}
.list__edit:hover { background: var(--yz-hover); }
.list__empty {
  padding: 32px;
  text-align: center;
  font-size: 13px;
  color: var(--yz-ink-3);
}
</style>
