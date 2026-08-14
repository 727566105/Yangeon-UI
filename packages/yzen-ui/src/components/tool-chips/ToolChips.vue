<script setup lang="ts">
// YzToolChips — Tool Chips 工具调用（移植自 beautifului.dev Tool Chips）
// 折叠的工具调用计数摘要 + 代码编辑/函数调用 chips 列表
import { ref, watch } from 'vue'
import { YzIcon } from '../../index'

export interface ToolCall {
  type?: 'edit' | 'call'
  name: string
  status?: 'running' | 'done'
}

interface ToolChipsProps {
  expanded?: boolean
  calls?: ToolCall[]
  messages?: number
}

const props = withDefaults(defineProps<ToolChipsProps>(), {
  expanded: true,
  calls: () => [
    { type: 'edit', name: 'src/aurora/plasma.ts' },
    { type: 'call', name: 'observe.spectrum(alpha, beta)' },
    { type: 'call', name: 'model.predict(flux)' },
    { type: 'edit', name: 'config/observatory.yaml' },
  ],
  messages: 2,
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'update:expanded', value: boolean): void
}>()

// 受控/非受控双模式（同 YzThinking）
const open = ref(props.expanded)
watch(
  () => props.expanded,
  (v) => (open.value = v),
)

function toggle() {
  open.value = !open.value
  emit('toggle')
  emit('update:expanded', open.value)
}
</script>

<template>
  <div class="yz-tool-chips">
    <button
      type="button"
      class="yz-tool-chips__toggle"
      :aria-expanded="open"
      @click="toggle"
    >
      <YzIcon
        name="chevron-down"
        :size="12"
        :stroke-width="2.2"
        class="yz-tool-chips__chevron"
        :class="{ 'yz-tool-chips__chevron--open': open }"
      />
      <span class="yz-tool-chips__summary">{{ calls.length }} tool calls, {{ messages }} messages</span>
    </button>

    <div
      class="yz-tool-chips__collapse"
      :class="{ 'yz-tool-chips__collapse--open': open }"
    >
      <div class="yz-tool-chips__viewport">
        <div class="yz-tool-chips__list">
          <div
            v-for="(call, i) in calls"
            :key="i"
            class="yz-tool-chips__chip"
            :class="`yz-tool-chips__chip--${call.type ?? 'call'}`"
          >
            <!-- 代码编辑 → 代码符号；函数调用 → 终端符号 -->
            <svg
              v-if="call.type === 'edit'"
              class="yz-tool-chips__chip-icon"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
            <YzIcon v-else name="terminal" :size="12" class="yz-tool-chips__chip-icon" />
            <span class="yz-tool-chips__chip-name">{{ call.name }}</span>
            <span class="yz-tool-chips__chip-status">
              <YzIcon
                v-if="call.status === 'running'"
                name="loading"
                :size="11"
                class="yz-tool-chips__spinner"
              />
              <YzIcon v-else name="check" :size="11" />
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 根容器（beautifului: min-h-[220px] w-full max-w-80 pb-1） */
.yz-tool-chips {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 320px;
  min-height: 220px;
  padding-bottom: 4px;
}

/* 折叠开关（beautifului: -mx-1.5 w-fit gap-1.5 rounded-control px-1.5 py-1 text-[12.5px]） */
.yz-tool-chips__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  margin: 0 -6px;
  padding: 4px 6px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  font-size: 12.5px;
  color: var(--yz-ink-2);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-tool-chips__toggle:hover {
  background: var(--yz-hover-2);
}

/* 摘要数字等宽（beautifului: tabular-nums） */
.yz-tool-chips__summary {
  font-variant-numeric: tabular-nums;
}

/* 箭头：展开旋转 180deg（beautifului: transition-transform duration-200） */
.yz-tool-chips__chevron {
  transition: transform 200ms var(--yz-ease-out-strong);
}
.yz-tool-chips__chevron--open {
  transform: rotate(180deg);
}

/* 折叠区：grid-rows 0fr/1fr + opacity（beautifului: duration-300） */
.yz-tool-chips__collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 300ms var(--yz-ease-out-strong), opacity 300ms var(--yz-ease-out-strong);
}
.yz-tool-chips__collapse--open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.yz-tool-chips__viewport {
  overflow: hidden;
}

/* chips 列表（beautifului: -mx-1 overflow-hidden px-1.5 pb-1 > mt-1.5 flex flex-col gap-1） */
.yz-tool-chips__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 6px -4px 0;
  padding: 0 6px 4px;
}

/* chip：圆角行 + 发丝边框，等宽工具名 */
.yz-tool-chips__chip {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 5px 8px;
  border-radius: var(--yz-radius-control);
  border: 1px solid var(--yz-line);
  background: var(--yz-surface);
}
.yz-tool-chips__chip-icon {
  flex-shrink: 0;
  color: var(--yz-ink-3);
}
.yz-tool-chips__chip--edit .yz-tool-chips__chip-icon {
  color: var(--yz-tag-blue);
}
.yz-tool-chips__chip--call .yz-tool-chips__chip-icon {
  color: var(--yz-tag-purple);
}
.yz-tool-chips__chip-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-2);
}
.yz-tool-chips__chip-status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-left: auto;
  color: var(--yz-green);
}
.yz-tool-chips__spinner {
  color: var(--yz-ink-3);
  animation: yz-spin 0.9s linear infinite;
}

/* 动效开关：关闭时停掉旋转/折叠过渡 */
@media (prefers-reduced-motion: reduce) {
  .yz-tool-chips__chevron,
  .yz-tool-chips__collapse {
    transition: none;
  }
  .yz-tool-chips__spinner {
    animation: none;
  }
}
</style>
