<script setup lang="ts">
// YzCodeBlock — AI 代码块（移植自 beautifului.dev Code Block）
// 文件头 + 语言标签 + 复制按钮 + 逐行流式入场的代码区
import { computed, ref } from 'vue'
import { YzIcon } from '../../index'

interface CodeBlockProps {
  filename?: string
  language?: string
  code?: string
  streaming?: boolean
  copyable?: boolean
}

const props = withDefaults(defineProps<CodeBlockProps>(), {
  filename: 'churn.ts',
  language: 'TypeScript',
  code: `// 极光观测任务：流失客户预测模型\nconst churn = async (session: Session) => {\n  const risk = await model.predict(session.features)\n  if (risk > 0.85) {\n    await alerts.notify(\`high churn: \${session.id}\`)\n  }\n  return risk\n}`,
  streaming: true,
  copyable: true,
})

const emit = defineEmits<{ (e: 'copy'): void }>()

const lines = computed(() => props.code.split('\n'))

const copied = ref(false)

async function copy() {
  if (!props.copyable) return
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    emit('copy')
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* clipboard 不可用时静默 */
  }
}
</script>

<template>
  <div class="yz-code-block">
    <div class="yz-code-block__bar">
      <span class="yz-code-block__file">
        <span class="yz-code-block__filename">{{ filename }}</span>
        <span class="yz-code-block__lang">{{ language }}</span>
      </span>
      <button
        v-if="copyable"
        class="yz-code-block__copy"
        type="button"
        :aria-label="copied ? '已复制' : '复制代码'"
        @click="copy"
      >
        <YzIcon :name="copied ? 'check' : 'copy'" :size="10" />
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <pre class="yz-code-block__pre"><code><span
      v-for="(line, i) in lines"
      :key="i"
      class="yz-code-block__line"
      :class="{ 'yz-code-block__line--stream': streaming }"
      :style="streaming ? { animationDelay: `${i * 90}ms` } : undefined"
    >{{ line }}</span></code></pre>
  </div>
</template>

<style scoped>
/* 卡片结构（beautifului: rounded-card bg-surface shadow-card overflow-hidden） */
.yz-code-block {
  width: 100%;
  max-width: 380px;
  overflow: hidden;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
}

/* 卡片头（beautifului: primitive-card-bar flex justify-between border-b） */
.yz-code-block__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--yz-line);
}
.yz-code-block__file {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.yz-code-block__filename {
  font-family: var(--yz-font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink);
}
.yz-code-block__lang {
  font-size: 11.5px;
  color: var(--yz-ink-3);
}
.yz-code-block__copy {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  margin: 4px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.yz-code-block__copy:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}

/* 代码区（beautifului: bg-inset px-3 py-2.5 font-mono 11.5px leading-1.7） */
.yz-code-block__pre {
  margin: 0;
  min-height: 137px;
  padding: 10px 12px;
  background: var(--yz-inset);
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  line-height: 1.7;
  color: var(--yz-ink-2);
  overflow-x: auto;
}
.yz-code-block__line {
  display: block;
  white-space: pre;
}

/* 流式逐行入场（beautifului: stream-in 模糊淡入，90ms stagger） */
.yz-code-block__line--stream {
  animation: yz-stream-in 320ms var(--yz-ease-out-strong) both;
}
@media (prefers-reduced-motion: reduce) {
  .yz-code-block__line--stream {
    animation: none;
  }
}
</style>
