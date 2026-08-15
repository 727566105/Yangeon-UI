<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Platform } from '@yzen-ui/shared'
import { fetchPlatforms, savePlatforms, fetchRegistry } from '../api'
import { useI18n } from '../i18n'

const { t } = useI18n()

// 编辑副本：数组顺序即展示站端切换器顺序（保存时 order = index + 1）
const platforms = ref<Platform[]>([])
const usage = ref<Record<string, number>>({})
const saving = ref(false)
const savedOk = ref(false)
const errors = ref<string[]>([])

onMounted(async () => {
  const [plats, entries] = await Promise.all([fetchPlatforms(), fetchRegistry()])
  platforms.value = [...plats].sort((a, b) => a.order - b.order)
  usage.value = {}
  for (const e of entries) {
    usage.value[e.platform] = (usage.value[e.platform] ?? 0) + 1
  }
})

function addPlatform() {
  const maxOrder = platforms.value.reduce((m, p) => Math.max(m, p.order), 0)
  platforms.value.push({ key: '', label: { zh: '', en: '' }, order: maxOrder + 1 })
}

function removePlatform(i: number) {
  const p = platforms.value[i]
  if (usage.value[p.key] > 0) return // 使用中禁止删除（服务端也会校验）
  platforms.value.splice(i, 1)
}

function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= platforms.value.length) return
  const arr = platforms.value
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}

async function save() {
  errors.value = []
  const ordered = platforms.value.map((p, i) => ({ ...p, order: i + 1 }))
  saving.value = true
  try {
    const res = await savePlatforms(ordered)
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
  <div class="plats">
    <div class="plats__head">
      <h2 class="plats__title">{{ t('platforms.title') }}</h2>
      <div class="plats__actions">
        <button type="button" class="plats__add" @click="addPlatform">+ {{ t('platforms.add') }}</button>
        <button type="button" class="plats__save" :disabled="saving" @click="save">
          {{ saving ? t('common.saving') : t('platforms.save') }}
        </button>
      </div>
    </div>

    <p v-if="savedOk" class="plats__toast">{{ t('edit.saved') }}</p>
    <ul v-if="errors.length" class="plats__errors">
      <li v-for="(err, i) in errors" :key="i">{{ err }}</li>
    </ul>

    <div class="plats__list">
      <div v-for="(p, i) in platforms" :key="i" class="plats__row">
        <div class="plats__order">
          <button type="button" class="plats__mini" :disabled="i === 0" @click="move(i, -1)">↑</button>
          <button type="button" class="plats__mini" :disabled="i === platforms.length - 1" @click="move(i, 1)">↓</button>
        </div>
        <span class="plats__index">{{ i + 1 }}</span>
        <input
          v-model="p.key"
          class="plats__input plats__input--key"
          type="text"
          :placeholder="t('platforms.keyPlaceholder')"
          :disabled="usage[p.key] > 0"
          :title="usage[p.key] > 0 ? t('platforms.inUse') : ''"
        />
        <input v-model="p.label.zh" class="plats__input" type="text" :placeholder="t('common.zh')" />
        <input v-model="p.label.en" class="plats__input" type="text" :placeholder="t('common.en')" />
        <span class="plats__usage" :title="t('platforms.usage')">
          {{ usage[p.key] ?? 0 }}
        </span>
        <button
          type="button"
          class="plats__mini plats__mini--danger"
          :disabled="usage[p.key] > 0"
          :title="usage[p.key] > 0 ? t('platforms.inUse') : ''"
          @click="removePlatform(i)"
        >✕</button>
      </div>
      <p v-if="platforms.length === 0" class="plats__empty">{{ t('list.empty') }}</p>
    </div>
  </div>
</template>

<style scoped>
.plats__head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.plats__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}
.plats__actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}
.plats__add {
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
.plats__save {
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
.plats__save:disabled { opacity: 0.6; cursor: default; }
.plats__toast {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-green) 15%, transparent);
  font-size: 12.5px;
}
.plats__errors {
  margin: 0 0 12px;
  padding: 10px 12px 10px 28px;
  border-radius: var(--yz-radius-control);
  background: color-mix(in srgb, var(--yz-tag-red) 12%, transparent);
  font-size: 12.5px;
}
.plats__errors li { margin: 2px 0; }
.plats__list {
  padding: 12px;
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.plats__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--yz-line);
}
.plats__row:last-child { border-bottom: none; }
.plats__order {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.plats__index {
  width: 22px;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-3);
  font-variant-numeric: tabular-nums;
}
.plats__input {
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
.plats__input--key {
  flex: 0 0 140px;
  font-family: var(--yz-font-mono);
  font-size: 12px;
}
.plats__input:disabled { opacity: 0.55; cursor: not-allowed; }
.plats__usage {
  width: 44px;
  text-align: center;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-3);
  font-variant-numeric: tabular-nums;
}
.plats__mini {
  border: none;
  background: transparent;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 12px;
  color: var(--yz-ink-3);
  cursor: pointer;
}
.plats__mini:hover { background: var(--yz-hover); color: var(--yz-ink); }
.plats__mini:disabled { opacity: 0.35; cursor: default; }
.plats__mini--danger:hover { color: var(--yz-tag-red); }
.plats__empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--yz-ink-3);
}
</style>
