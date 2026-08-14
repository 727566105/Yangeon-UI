<script setup lang="ts">
// YzPromptBar — Prompt Bar AI 输入条（移植自 beautifului.dev Prompt Bar）
// 附件/模型选择/语音/发送 四按钮 + textarea 自动高度；canvas 背景特效不做（规范跳过）
import { nextTick, onMounted, ref, watch } from 'vue'
import { YzIcon } from '../../index'

interface PromptBarProps {
  placeholder?: string
  model?: string
  shape?: 'rounded' | 'pill'
  modelValue?: string
}

const props = withDefaults(defineProps<PromptBarProps>(), {
  placeholder: 'Write a message…',
  model: 'Aurora 1',
  shape: 'rounded',
  modelValue: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send', value: string): void
  (e: 'attach'): void
  (e: 'model'): void
  (e: 'dictate', dictating: boolean): void
}>()

const text = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => (text.value = v),
)

const dictating = ref(false)

const inputEl = ref<HTMLTextAreaElement | null>(null)

// textarea 自动高度（beautifului: rows=1 + scrollHeight 撑开，min-h-7 = 28px）
function autosize() {
  const el = inputEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
onMounted(autosize)
watch(text, () => nextTick(autosize))

function onInput(event: Event) {
  text.value = (event.target as HTMLTextAreaElement).value
  emit('update:modelValue', text.value)
  autosize()
}

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('send', value)
  text.value = ''
  emit('update:modelValue', '')
  nextTick(autosize)
}

function toggleDictate() {
  dictating.value = !dictating.value
  emit('dictate', dictating.value)
}
</script>

<template>
  <div class="yz-prompt-bar" :class="`yz-prompt-bar--${shape}`">
    <div class="yz-prompt-bar__box">
      <div class="yz-prompt-bar__grid">
        <!-- 附件/来源 -->
        <button
          type="button"
          class="yz-prompt-bar__btn"
          aria-label="添加附件"
          aria-expanded="false"
          @click="emit('attach')"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <!-- 输入区 -->
        <textarea
          ref="inputEl"
          :value="text"
          rows="1"
          class="yz-prompt-bar__input"
          :placeholder="placeholder"
          aria-label="Prompt"
          @input="onInput"
          @keydown.enter.exact.prevent="submit"
        />

        <!-- 模型选择 -->
        <button
          type="button"
          class="yz-prompt-bar__model"
          aria-expanded="false"
          aria-label="选择模型"
          @click="emit('model')"
        >
          <span class="yz-prompt-bar__model-name">{{ model }}</span>
          <YzIcon
            name="chevron-down"
            :size="11"
            :stroke-width="2.4"
            class="yz-prompt-bar__model-chevron"
          />
        </button>

        <!-- 语音输入 -->
        <button
          type="button"
          class="yz-prompt-bar__btn"
          :aria-label="dictating ? '停止语音输入' : '开始语音输入'"
          :aria-pressed="dictating"
          @click="toggleDictate"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
          </svg>
        </button>

        <!-- 发送 -->
        <button
          type="button"
          class="yz-prompt-bar__send"
          aria-label="发送"
          :disabled="!text.trim()"
          @click="submit"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 根容器（beautifului: w-full max-w-105） */
.yz-prompt-bar {
  width: 100%;
  max-width: 420px;
}

/* 输入框外壳（beautifului: border-line bg-surface p-1.5 shadow-card focus-within:border-line-strong） */
.yz-prompt-bar__box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
  padding: 6px;
  border: 1px solid var(--yz-line);
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
  transition: border-color 150ms var(--yz-ease-out-strong), border-radius 150ms var(--yz-ease-out-strong);
}
.yz-prompt-bar__box:focus-within {
  border-color: var(--yz-line-strong);
}
.yz-prompt-bar--pill .yz-prompt-bar__box {
  border-radius: var(--yz-radius-pill);
}

/* 五列布局（beautifului: grid-cols-[28px_minmax(0,1fr)_auto_28px_28px] items-end） */
.yz-prompt-bar__grid {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto 28px 28px;
  align-items: end;
  column-gap: 4px;
  row-gap: 6px;
}

/* 按钮基座（beautifului: size-7 rounded-[8px]，hover + active:scale-0.94） */
.yz-prompt-bar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong), transform 150ms var(--yz-ease-out-strong);
}
.yz-prompt-bar__btn:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
.yz-prompt-bar__btn:active {
  transform: scale(0.94);
}

/* 语音录制态 */
.yz-prompt-bar__btn[aria-pressed='true'] {
  background: var(--yz-accent-tint);
  color: var(--yz-accent);
}

/* textarea（beautifului: min-h-7 px-1 py-[5px] text-[13px] leading-[18px]） */
.yz-prompt-bar__input {
  width: 100%;
  min-width: 0;
  min-height: 28px;
  resize: none;
  padding: 5px 4px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  line-height: 18px;
  color: var(--yz-ink);
  outline: none;
  overflow-wrap: anywhere;
}
.yz-prompt-bar__input::placeholder {
  color: var(--yz-ink-3);
}

/* 模型选择（beautifului: h-7 px-1.5 text-[12px] font-medium text-ink-2） */
.yz-prompt-bar__model {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 6px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-2);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.yz-prompt-bar__model:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
.yz-prompt-bar__model-chevron {
  color: var(--yz-ink-3);
}

/* 发送：空文本禁用（beautifului: bg line-strong + ink-2），有文本变强调色 */
.yz-prompt-bar__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: var(--yz-line-strong);
  color: var(--yz-ink-2);
  cursor: pointer;
  transition: background-color 200ms var(--yz-ease-out-strong), color 200ms var(--yz-ease-out-strong), transform 200ms var(--yz-ease-out-strong);
}
.yz-prompt-bar__send:not(:disabled) {
  background: var(--yz-accent);
  color: #ffffff;
}
.yz-prompt-bar__send:disabled {
  cursor: default;
}
.yz-prompt-bar__send:not(:disabled):active {
  transform: scale(0.94);
}
</style>
