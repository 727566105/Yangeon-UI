<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { importComponent, fetchCategories, fetchRegistry, saveRegistry } from '../api'
import type { RegistryCategory, RegistryEntry } from '@yzen-ui/shared'
import { useI18n } from '../i18n'
import SandboxPreview from '../components/SandboxPreview.vue'

const emit = defineEmits<{ (e: 'done'): void }>()
const { t, localized } = useI18n()

const source = ref('')
const key = ref('')
// 元信息（收录即上站：PRD 7.5 收录流程，生成组件文件后直接写入 registry）
const meta = ref({
  nameZh: '',
  nameEn: '',
  descZh: '',
  descEn: '',
  category: '',
  tagZh: '',
  tagEn: '',
})
const categories = ref<RegistryCategory[]>([])

const status = ref<'idle' | 'busy' | 'ok' | 'error'>('idle')
const message = ref('')

onMounted(async () => {
  try {
    categories.value = await fetchCategories()
    meta.value.category = categories.value[0]?.key ?? 'basic'
  } catch {
    /* 分类加载失败时用默认值兜底 */
  }
})

// 拖拽 .vue 文件（单文件或目录递归读取，webkitGetAsEntry 基线）
function onDrop(e: DragEvent) {
  e.preventDefault()
  const items = [...(e.dataTransfer?.items ?? [])]
  readItems(items)
}

function readItems(items: DataTransferItem[]) {
  for (const item of items) {
    const entry = (item as DataTransferItem & { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.()
    if (!entry) continue
    readEntry(entry)
  }
}

function readEntry(entry: FileSystemEntry) {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    fileEntry.file((file) => {
      if (!file.name.endsWith('.vue')) return
      const reader = new FileReader()
      reader.onload = () => {
        source.value = String(reader.result ?? '')
        if (!key.value) key.value = file.name.replace(/\.vue$/, '').toLowerCase()
      }
      reader.readAsText(file)
    })
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const reader = dirEntry.createReader()
    reader.readEntries((entries) => {
      for (const child of entries) readEntry(child)
    })
  }
}

// 本地校验（与 shared validateRegistry 的双语文案要求一致）
function validate(): string {
  if (!source.value.trim()) return t('import.errorNoSource')
  if (!key.value.trim()) return t('import.keyLabel')
  if (!meta.value.nameZh.trim() || !meta.value.nameEn.trim()) return t('import.errorMeta')
  if (!meta.value.descZh.trim() || !meta.value.descEn.trim()) return t('import.errorMeta')
  if (!meta.value.tagZh.trim() || !meta.value.tagEn.trim()) return t('import.errorMeta')
  return ''
}

// 生成组件四文件 + 写入 registry 条目（收录即上站）
async function doImport() {
  message.value = ''
  const invalid = validate()
  if (invalid) {
    status.value = 'error'
    message.value = invalid
    return
  }
  status.value = 'busy'
  const k = key.value.trim()
  try {
    const created = await importComponent(k, source.value)
    if (!created.ok) {
      status.value = 'error'
      message.value = created.error
      return
    }
    // 写入 registry：新条目（order = max + 1，默认变体，分类/标签/文案来自表单）
    const all = await fetchRegistry()
    const entry: RegistryEntry = {
      key: k,
      name: { zh: meta.value.nameZh.trim(), en: meta.value.nameEn.trim() },
      description: { zh: meta.value.descZh.trim(), en: meta.value.descEn.trim() },
      category: meta.value.category,
      tags: [{ zh: meta.value.tagZh.trim(), en: meta.value.tagEn.trim() }],
      order: Math.max(0, ...all.map((e) => e.order)) + 1,
      visible: true,
      source: `components/${k}`,
      variants: [{ id: 'default', label: { zh: '默认', en: 'Default' }, props: {} }],
    }
    all.push(entry)
    const saved = await saveRegistry(all)
    if (!saved.ok) {
      status.value = 'error'
      message.value = saved.errors.join('；')
      return
    }
    status.value = 'ok'
    message.value = t('import.savedDone')
  } catch (e) {
    status.value = 'error'
    message.value = e instanceof Error ? e.message : String(e)
  }
}

function done() {
  emit('done')
}
</script>

<template>
  <div class="wizard">
    <h2 class="wizard__title">{{ t('import.title') }}</h2>

    <div class="wizard__layout">
      <div class="wizard__left">
        <section class="wizard__section">
          <h3 class="wizard__step">{{ t('import.step') }} 1 · {{ t('import.step1') }}</h3>
          <div class="wizard__grid">
            <label class="wizard__field">
              <span class="wizard__label">{{ t('import.keyLabel') }}</span>
              <input v-model="key" class="wizard__input" type="text" :placeholder="t('import.keyHint')" />
            </label>
            <label class="wizard__field">
              <span class="wizard__label">{{ t('edit.category') }}</span>
              <select v-model="meta.category" class="wizard__input">
                <option v-for="c in categories" :key="c.key" :value="c.key">{{ localized(c.label) }}</option>
              </select>
            </label>
            <label class="wizard__field">
              <span class="wizard__label">{{ t('edit.name') }} · {{ t('common.zh') }}</span>
              <input v-model="meta.nameZh" class="wizard__input" type="text" />
            </label>
            <label class="wizard__field">
              <span class="wizard__label">{{ t('edit.name') }} · {{ t('common.en') }}</span>
              <input v-model="meta.nameEn" class="wizard__input" type="text" />
            </label>
            <label class="wizard__field">
              <span class="wizard__label">{{ t('edit.description') }} · {{ t('common.zh') }}</span>
              <input v-model="meta.descZh" class="wizard__input" type="text" />
            </label>
            <label class="wizard__field">
              <span class="wizard__label">{{ t('edit.description') }} · {{ t('common.en') }}</span>
              <input v-model="meta.descEn" class="wizard__input" type="text" />
            </label>
            <label class="wizard__field">
              <span class="wizard__label">{{ t('edit.tags') }} · {{ t('common.zh') }}</span>
              <input v-model="meta.tagZh" class="wizard__input" type="text" />
            </label>
            <label class="wizard__field">
              <span class="wizard__label">{{ t('edit.tags') }} · {{ t('common.en') }}</span>
              <input v-model="meta.tagEn" class="wizard__input" type="text" />
            </label>
          </div>
          <textarea
            v-model="source"
            class="wizard__textarea"
            rows="10"
            spellcheck="false"
            :placeholder="t('import.pastePlaceholder')"
            @dragover.prevent
            @drop="onDrop"
          />
          <p class="wizard__hint">{{ t('import.dragHint') }}</p>
        </section>

        <section class="wizard__section">
          <h3 class="wizard__step">{{ t('import.step') }} 2 · {{ t('import.preview') }}</h3>
          <SandboxPreview :source="source" />
          <p class="wizard__hint">{{ t('import.previewHint') }}</p>
        </section>
      </div>

      <aside class="wizard__right">
        <button
          type="button"
          class="wizard__import"
          :disabled="status === 'busy'"
          @click="doImport"
        >{{ status === 'busy' ? t('common.saving') : t('import.import') }}</button>
        <p v-if="status === 'error'" class="wizard__msg wizard__msg--error">{{ message }}</p>
        <p v-else-if="status === 'ok'" class="wizard__msg wizard__msg--ok">
          {{ message }}
          <button type="button" class="wizard__goto" @click="done">
            {{ t('import.backToList') }} →
          </button>
        </p>
        <p class="wizard__hint wizard__hint--meta">{{ t('import.metaHint') }}</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.wizard__title {
  margin: 0 0 16px;
  font-size: 17px;
  font-weight: 600;
}
.wizard__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 24px;
  align-items: start;
}
@media (max-width: 960px) {
  .wizard__layout { grid-template-columns: 1fr; }
}
.wizard__section {
  padding: 16px;
  margin-bottom: 16px;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.wizard__step {
  margin: 0 0 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--yz-ink-2);
}
.wizard__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.wizard__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.wizard__label {
  font-size: 11.5px;
  color: var(--yz-ink-3);
}
.wizard__input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-size: 13px;
  outline: none;
}
.wizard__input:focus {
  border-color: var(--yz-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--yz-accent) 20%, transparent);
}
.wizard__textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px dashed var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-inset);
  color: var(--yz-ink-2);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
.wizard__textarea:focus {
  border-color: var(--yz-accent);
  border-style: solid;
}
.wizard__hint {
  margin: 6px 0 0;
  font-size: 11.5px;
  color: var(--yz-ink-3);
}
.wizard__hint--meta {
  margin-top: 12px;
  line-height: 1.6;
}
.wizard__import {
  width: 100%;
  height: 36px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: var(--yz-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 150ms var(--yz-ease-out-strong);
}
.wizard__import:active { transform: scale(0.97); }
.wizard__import:disabled { opacity: 0.6; cursor: default; }
.wizard__msg {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: var(--yz-radius-control);
  font-size: 12.5px;
}
.wizard__msg--error { background: color-mix(in srgb, var(--yz-tag-red) 12%, transparent); }
.wizard__msg--ok { background: color-mix(in srgb, var(--yz-green) 15%, transparent); }
.wizard__goto {
  margin-left: 8px;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--yz-accent);
  cursor: pointer;
}
</style>
