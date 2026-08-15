<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '../i18n'
import { saveRegistry } from '../api'
import type { Platform, RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

const props = defineProps<{
  entries: RegistryEntry[]
  categories: RegistryCategory[]
  platforms: Platform[]
}>()
const emit = defineEmits<{
  (e: 'edit', key: string): void
  (e: 'import'): void
  (e: 'order-saved'): void
}>()

const { t, localized } = useI18n()

const search = ref('')
const category = ref('all')
const platform = ref('all')

// 排序草稿：数组顺序即展示顺序（保存时 order = index + 1，与分类管理同款）
const orderedKeys = ref<string[]>([])
watch(
  () => props.entries,
  (entries) => {
    orderedKeys.value = [...entries].sort((a, b) => a.order - b.order).map((e) => e.key)
  },
  { immediate: true },
)

const saving = ref(false)
const savedOk = ref(false)
const saveError = ref('')

async function move(key: string, dir: -1 | 1) {
  if (saving.value) return
  const i = orderedKeys.value.indexOf(key)
  // 父级刷新 entries 后 watch 尚未同步草稿的窗口内 indexOf 可能为 -1，直接忽略
  if (i < 0) return
  const j = i + dir
  if (j < 0 || j >= orderedKeys.value.length) return
  const prev = [...orderedKeys.value]
  // 乐观更新：先交换，保存失败再回滚
  ;[orderedKeys.value[i], orderedKeys.value[j]] = [orderedKeys.value[j], orderedKeys.value[i]]
  saving.value = true
  saveError.value = ''
  try {
    const byKey = new Map(props.entries.map((e) => [e.key, e]))
    const reordered = orderedKeys.value.map((k, idx) => ({ ...byKey.get(k)!, order: idx + 1 }))
    const res = await saveRegistry(reordered)
    if (!res.ok) throw new Error(res.errors.join('；'))
    savedOk.value = true
    setTimeout(() => (savedOk.value = false), 1500)
    emit('order-saved')
  } catch (e) {
    orderedKeys.value = prev // 保存失败回滚草稿
    saveError.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = props.entries.filter((e) => {
    if (category.value !== 'all' && e.category !== category.value) return false
    if (platform.value !== 'all' && e.platform !== platform.value) return false
    if (!q) return true
    const hay = `${e.key} ${e.name.zh} ${e.name.en} ${e.tags.map((x) => x.zh + x.en).join(' ')}`.toLowerCase()
    return hay.includes(q)
  })
  // 按排序草稿展示（未在草稿的排最后，兜底）
  return list.sort((a, b) => {
    const ia = orderedKeys.value.indexOf(a.key)
    const ib = orderedKeys.value.indexOf(b.key)
    const na = ia === -1 ? Number.MAX_SAFE_INTEGER : ia
    const nb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib
    return na - nb
  })
})

const categoryLabel = (key: string) => {
  const c = props.categories.find((x) => x.key === key)
  return c ? localized(c.label) : key
}

const platformLabel = (key: string) => {
  const p = props.platforms.find((x) => x.key === key)
  return p ? localized(p.label) : key
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
      <select v-model="platform" class="list__select" :aria-label="t('list.platformAll')">
        <option value="all">{{ t('list.platformAll') }}</option>
        <option v-for="p in platforms" :key="p.key" :value="p.key">{{ localized(p.label) }}</option>
      </select>
      <button
        type="button"
        class="list__add"
        @click="$emit('import')"
      >+ {{ t('list.add') }}</button>
    </div>

    <p v-if="savedOk" class="list__toast">{{ t('edit.saved') }}</p>
    <p v-if="saveError" class="list__error">{{ saveError }}</p>

    <div class="list__table-wrap">
      <table class="list__table">
        <thead>
          <tr>
            <th class="list__th list__th--num">#</th>
            <th class="list__th">{{ t('edit.name') }}</th>
            <th class="list__th">{{ t('edit.category') }}</th>
            <th class="list__th">{{ t('edit.platform') }}</th>
            <th class="list__th">{{ t('edit.tags') }}</th>
            <th class="list__th list__th--num">{{ t('list.variants') }}</th>
            <th class="list__th list__th--status">{{ t('list.visible') }}</th>
            <th class="list__th list__th--action" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(e, i) in filtered" :key="e.key" class="list__row">
            <td class="list__td list__td--num">{{ String(i + 1).padStart(2, '0') }}</td>
            <td class="list__td list__td--name">
              <code class="list__key">{{ e.key }}</code>
              <span class="list__name">{{ localized(e.name) }}</span>
            </td>
            <td class="list__td"><code class="list__key">{{ categoryLabel(e.category) }}</code></td>
            <td class="list__td">
              <span class="list__plat">{{ platformLabel(e.platform) }}</span>
            </td>
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
              <span class="list__order">
                <button
                  type="button"
                  class="list__mini"
                  :disabled="saving || orderedKeys.indexOf(e.key) === 0"
                  :aria-label="t('list.moveUp')"
                  :title="t('list.moveUp')"
                  @click="move(e.key, -1)"
                >↑</button>
                <button
                  type="button"
                  class="list__mini"
                  :disabled="saving || orderedKeys.indexOf(e.key) === orderedKeys.length - 1"
                  :aria-label="t('list.moveDown')"
                  :title="t('list.moveDown')"
                  @click="move(e.key, 1)"
                >↓</button>
              </span>
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
.list__th--action { width: 110px; }
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
.list__plat {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 99px;
  background: color-mix(in srgb, var(--yz-accent) 12%, transparent);
  font-size: 11px;
  color: var(--yz-accent-ink, var(--yz-ink-2));
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
.list__order {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  margin-right: 4px;
  vertical-align: middle;
}
.list__mini {
  border: none;
  background: transparent;
  padding: 1px 7px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.2;
  color: var(--yz-ink-3);
  cursor: pointer;
}
.list__mini:hover { background: var(--yz-hover); color: var(--yz-ink); }
.list__mini:disabled { opacity: 0.35; cursor: default; }
.list__toast {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-green) 15%, transparent);
  font-size: 12.5px;
}
.list__error {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-tag-red) 12%, transparent);
  font-size: 12.5px;
  color: var(--yz-ink);
}
.list__empty {
  padding: 32px;
  text-align: center;
  font-size: 13px;
  color: var(--yz-ink-3);
}
</style>
