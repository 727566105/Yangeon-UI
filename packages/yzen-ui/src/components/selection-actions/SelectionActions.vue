<script setup lang="ts">
// YzSelectionActions — 文本选择浮动操作条（移植自 beautifului.dev Selection Actions）
// 悬浮于选中文本上方的工具条：描述输入 + 操作按钮（Explain/Improve/Shorten/Tone/Grammar）+ 发送
import { computed } from 'vue'

interface SelectionActionsProps {
  open?: boolean
  modelValue?: string
  position?: { x: number; y: number }
  actions?: string[]
}

const props = withDefaults(defineProps<SelectionActionsProps>(), {
  open: false,
  modelValue: '',
  position: () => ({ x: 0, y: 0 }),
  actions: () => ['Explain', 'Improve', 'Shorten', 'Tone', 'Grammar'],
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'action', name: string): void
  (e: 'submit'): void
}>()

const hasText = computed(() => props.modelValue.trim().length > 0)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function handleSubmit() {
  if (!hasText.value) return
  emit('submit')
}
</script>

<template>
  <div class="yz-selection-actions">
    <!-- 选中文本示例 -->
    <p class="yz-selection-actions__text">
      Pistachio holds the top slot all weekend.
      <span class="yz-selection-actions__mark"
        >Churn it first thing Saturday so the batch has time to firm up before the afternoon rush.</span
      >
    </p>

    <!-- 浮动工具条（beautifului: absolute + translateX(-50%) + 320ms 过渡 + shadow-overlay） -->
    <div
      class="yz-selection-actions__bar"
      :class="{ 'yz-selection-actions__bar--open': open }"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      role="toolbar"
      aria-label="编辑选中文本"
    >
      <input
        class="yz-selection-actions__input"
        type="text"
        :value="modelValue"
        placeholder="Describe edits"
        aria-label="描述编辑"
        @input="onInput"
      />

      <span v-if="hasText" class="yz-selection-actions__divider" aria-hidden="true" />

      <button
        v-for="name in actions"
        :key="name"
        type="button"
        class="yz-selection-actions__btn"
        @click="emit('action', name)"
      >
        {{ name }}
      </button>

      <button
        type="button"
        class="yz-selection-actions__send"
        :class="{ 'yz-selection-actions__send--off': !hasText }"
        aria-label="发送"
        @click="handleSubmit"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 2L11 13" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 容器：相对定位承载浮动条（beautifului: relative select-none pb-12） */
.yz-selection-actions {
  position: relative;
  width: 100%;
  max-width: 460px;
  padding-bottom: 48px;
  -webkit-user-select: none;
  user-select: none;
}

/* 选中文本（beautifului: 13px leading-relaxed） */
.yz-selection-actions__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.625;
  color: var(--yz-ink);
}
.yz-selection-actions__mark {
  box-decoration-clone: clone;
  -webkit-box-decoration-break: clone;
  border-radius: 3px;
  background: var(--yz-accent-tint);
  color: var(--yz-ink);
}

/* 浮动条（beautifului: h-9 rounded-full bg-surface shadow-overlay + 浮动过渡） */
.yz-selection-actions__bar {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: fit-content;
  max-width: calc(100vw - 48px);
  height: 36px;
  padding: 4px;
  border-radius: 99px;
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: var(--yz-shadow-overlay);
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(-8px);
  transition: transform 320ms cubic-bezier(0.77, 0, 0.175, 1), opacity 180ms ease-out;
  will-change: transform;
}
.yz-selection-actions__bar--open {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .yz-selection-actions__bar {
    transition: none;
  }
}

/* 描述输入（beautifului: h-7 w-145px text-[12.5px]） */
.yz-selection-actions__input {
  width: 145px;
  height: 28px;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 10px 0 12px;
  font-size: 12.5px;
  font-family: var(--yz-font-sans);
  color: var(--yz-ink);
}
.yz-selection-actions__input::placeholder {
  color: var(--yz-ink-3);
}

/* 分隔线 */
.yz-selection-actions__divider {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  flex-shrink: 0;
  background: var(--yz-line-strong);
}

/* 操作按钮（beautifului: h-7 rounded-full px-2.5 text-[12px] hover:bg-hover active:scale-[0.96]） */
.yz-selection-actions__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  flex-shrink: 0;
  padding: 0 10px;
  border: none;
  border-radius: 99px;
  background: transparent;
  font-size: 12px;
  font-weight: 400;
  color: var(--yz-ink);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong), transform 150ms var(--yz-ease-out-strong);
}
.yz-selection-actions__btn:hover {
  background: var(--yz-hover);
}
.yz-selection-actions__btn:active {
  transform: scale(0.96);
}

/* 发送按钮（beautifului: size-7 rounded-full；禁用态 ink-3） */
.yz-selection-actions__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: none;
  border-radius: 99px;
  background: transparent;
  color: var(--yz-ink);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong), transform 150ms var(--yz-ease-out-strong);
}
.yz-selection-actions__send:hover {
  background: var(--yz-hover);
}
.yz-selection-actions__send:active {
  transform: scale(0.96);
}
.yz-selection-actions__send--off {
  color: var(--yz-ink-3);
  pointer-events: none;
}
</style>
