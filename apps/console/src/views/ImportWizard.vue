<script setup lang="ts">
import { ref } from 'vue'
import { importComponent } from '../api'
import { useI18n } from '../i18n'
import SandboxPreview from '../components/SandboxPreview.vue'

const emit = defineEmits<{ (e: 'done', key: string): void }>()
const { t } = useI18n()

const source = ref('')
const key = ref('')
const status = ref<'idle' | 'busy' | 'ok' | 'error'>('idle')
const message = ref('')
const importedName = ref('')
const importedKey = ref('')

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

async function doImport() {
  message.value = ''
  if (!source.value.trim()) {
    status.value = 'error'
    message.value = t('import.errorNoSource')
    return
  }
  if (!key.value.trim()) {
    status.value = 'error'
    message.value = t('import.keyLabel')
    return
  }
  status.value = 'busy'
  const result = await importComponent(key.value.trim(), source.value)
  if (result.ok) {
    status.value = 'ok'
    importedName.value = result.name
    importedKey.value = key.value.trim()
    message.value = t('import.imported')
  } else {
    status.value = 'error'
    message.value = result.error
  }
}

// 进入元信息补全（新建条目编辑页：PRD 7.5 收录流程闭环）
function goEdit() {
  emit('done', importedKey.value)
}
</script>

<template>
  <div class="wizard">
    <h2 class="wizard__title">{{ t('import.title') }}</h2>

    <div class="wizard__layout">
      <div class="wizard__left">
        <section class="wizard__section">
          <h3 class="wizard__step">{{ t('import.step') }} 1 · {{ t('import.step1') }}</h3>
          <label class="wizard__field">
            <span class="wizard__label">{{ t('import.keyLabel') }}</span>
            <input v-model="key" class="wizard__input" type="text" :placeholder="t('import.keyHint')" />
          </label>
          <textarea
            v-model="source"
            class="wizard__textarea"
            rows="14"
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
          <button type="button" class="wizard__goto" @click="goEdit">
            {{ t('import.step') }} 3 →
          </button>
        </p>
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
.wizard__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
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
