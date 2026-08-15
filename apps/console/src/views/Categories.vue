<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RegistryCategory } from '@yzen-ui/shared'
import { fetchCategories, saveCategories, fetchRegistry } from '../api'
import { useI18n } from '../i18n'

const { t } = useI18n()

// 编辑副本：数组顺序即展示站分组顺序（保存时 order = index + 1）
const categories = ref<RegistryCategory[]>([])
const usage = ref<Record<string, number>>({})
const saving = ref(false)
const savedOk = ref(false)
const errors = ref<string[]>([])

onMounted(async () => {
  const [cats, entries] = await Promise.all([fetchCategories(), fetchRegistry()])
  categories.value = [...cats].sort((a, b) => a.order - b.order)
  usage.value = {}
  for (const e of entries) {
    usage.value[e.category] = (usage.value[e.category] ?? 0) + 1
  }
})

function addCategory() {
  const maxOrder = categories.value.reduce((m, c) => Math.max(m, c.order), 0)
  categories.value.push({ key: '', label: { zh: '', en: '' }, order: maxOrder + 1 })
}

function removeCategory(i: number) {
  const c = categories.value[i]
  if (usage.value[c.key] > 0) return // 使用中禁止删除（服务端也会校验）
  categories.value.splice(i, 1)
}

function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= categories.value.length) return
  const arr = categories.value
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

async function save() {
  errors.value = []
  const ordered = categories.value.map((c, i) => ({ ...c, order: i + 1 }))
  saving.value = true
  try {
    const res = await saveCategories(ordered)
    if (res.ok) {
      savedOk.value = true
      setTimeout(() => (savedOk.value = false), 1500)
    } else {
      errors.value = res.errors
    }
  } catch (e) {
    errors.value = [e instanceof Error ? e.message : String(e)]
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="cats">
    <div class="cats__head">
      <h2 class="cats__title">{{ t('categories.title') }}</h2>
      <div class="cats__actions">
        <button type="button" class="cats__add" @click="addCategory">+ {{ t('categories.add') }}</button>
        <button type="button" class="cats__save" :disabled="saving" @click="save">
          {{ saving ? t('common.saving') : t('categories.save') }}
        </button>
      </div>
    </div>

    <p v-if="savedOk" class="cats__toast">{{ t('edit.saved') }}</p>
    <ul v-if="errors.length" class="cats__errors">
      <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
    </ul>

    <div class="cats__list">
      <div v-for="(c, i) in categories" :key="i" class="cats__row">
        <div class="cats__order">
          <button type="button" class="cats__mini" :disabled="i === 0" @click="move(i, -1)">↑</button>
          <button type="button" class="cats__mini" :disabled="i === categories.length - 1" @click="move(i, 1)">↓</button>
        </div>
        <span class="cats__index">{{ i + 1 }}</span>
        <input
          v-model="c.key"
          class="cats__input cats__input--key"
          type="text"
          :placeholder="t('categories.keyPlaceholder')"
          :disabled="usage[c.key] > 0"
          :title="usage[c.key] > 0 ? t('categories.inUse') : ''"
        />
        <input v-model="c.label.zh" class="cats__input" type="text" :placeholder="t('common.zh')" />
        <input v-model="c.label.en" class="cats__input" type="text" :placeholder="t('common.en')" />
        <span class="cats__usage" :title="t('categories.usage')">
          {{ usage[c.key] ?? 0 }}
        </span>
        <button
          type="button"
          class="cats__mini cats__mini--danger"
          :disabled="usage[c.key] > 0"
          :title="usage[c.key] > 0 ? t('categories.inUse') : ''"
          @click="removeCategory(i)"
        >✕</button>
      </div>
      <p v-if="categories.length === 0" class="cats__empty">{{ t('list.empty') }}</p>
    </div>
  </div>
</template>

<style scoped>
.cats__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.cats__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.cats__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.cats__add {
  height: 32px;
  padding: 0 14px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: var(--yz-field);
  color: var(--yz-ink);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.cats__save {
  height: 32px;
  padding: 0 18px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: var(--yz-ink);
  color: var(--yz-canvas);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(16, 24, 40, 0.1);
}
.cats__save:disabled { opacity: 0.6; cursor: default; }
.cats__toast {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-green) 15%, transparent);
  font-size: 12.5px;
}
.cats__errors {
  margin: 0 0 12px;
  padding: 10px 12px 10px 28px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-tag-red) 12%, transparent);
  font-size: 12.5px;
}
.cats__errors li { margin: 2px 0; }
.cats__list {
  padding: 12px;
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.cats__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--yz-line);
}
.cats__row:last-child { border-bottom: none; }
.cats__order {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cats__index {
  width: 22px;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-3);
  font-variant-numeric: tabular-nums;
}
.cats__input {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-size: 13px;
  outline: none;
  flex: 1;
}
.cats__input--key {
  flex: 0 0 140px;
  font-family: var(--yz-font-mono);
  font-size: 12px;
}
.cats__input:disabled { opacity: 0.55; cursor: not-allowed; }
.cats__usage {
  width: 44px;
  text-align: center;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-3);
  font-variant-numeric: tabular-nums;
}
.cats__mini {
  border: none;
  background: transparent;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--yz-ink-3);
  cursor: pointer;
}
.cats__mini:hover { background: var(--yz-hover); color: var(--yz-ink); }
.cats__mini:disabled { opacity: 0.35; cursor: default; }
.cats__mini--danger:hover { color: var(--yz-tag-red); }
.cats__empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--yz-ink-3);
}
</style>
