<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import { compileSfc } from '../compileSfc'
import { useI18n } from '../i18n'

// 沙箱预览（PRD 10.4）：编译产物在 iframe sandbox="allow-scripts"（无 allow-same-origin，
// opaque origin 隔离 localStorage/cookie）中运行，错误经 postMessage 回传。
const props = defineProps<{ source: string }>()
const { t } = useI18n()

const status = ref<'idle' | 'ok' | 'error'>('idle')
const error = ref('')
const previewUrl = ref('')
const blobUrl = ref('')

function revoke() {
  if (blobUrl.value) {
    URL.revokeObjectURL(blobUrl.value)
    blobUrl.value = ''
    previewUrl.value = ''
  }
}

watch(
  () => props.source,
  (src) => {
    revoke()
    if (!src.trim()) {
      status.value = 'idle'
      return
    }
    try {
      const { html } = compileSfc(src)
      blobUrl.value = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      previewUrl.value = blobUrl.value
      status.value = 'ok'
    } catch (e) {
      status.value = 'error'
      error.value = e instanceof Error ? e.message : String(e)
    }
  },
  { immediate: true },
)

// iframe 内 window.onerror → postMessage 回传
function onMessage(e: MessageEvent) {
  if (e.data?.type === 'sandbox-error') {
    status.value = 'error'
    error.value = `沙箱: ${e.data.message}`
  }
}

onBeforeUnmount(() => {
  revoke()
  window.removeEventListener('message', onMessage)
})
window.addEventListener('message', onMessage)
</script>

<template>
  <div class="sandbox">
    <div v-if="status === 'idle'" class="sandbox__hint">{{ t('import.pastePlaceholder') }}</div>
    <iframe
      v-else-if="status === 'ok'"
      :src="previewUrl"
      class="sandbox__frame"
      sandbox="allow-scripts"
      title="sandbox preview"
    />
    <div v-else class="sandbox__error">{{ error }}</div>
  </div>
</template>

<style scoped>
.sandbox {
  min-height: 160px;
  border-radius: var(--yz-radius-control);
  border: 1px solid var(--yz-line);
  background: var(--yz-canvas);
  overflow: hidden;
}
.sandbox__frame {
  display: block;
  width: 100%;
  height: 220px;
  border: none;
  background: #fff;
}
.sandbox__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  font-size: 12.5px;
  color: var(--yz-ink-3);
}
.sandbox__error {
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--yz-tag-red);
  white-space: pre-wrap;
}
</style>
