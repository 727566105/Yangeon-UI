<script setup lang="ts">
// YzSearch — Search 指令搜索（移植自 beautifului.dev Search）
// 命令式搜索卡片：实时过滤 + 空状态；⌘K 或 / 全局快捷键聚焦输入框
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { YzIcon } from '../../index'

interface SearchProps {
  modelValue?: string
  items?: string[]
  placeholder?: string
  emptyTitle?: string
  /** 快捷键提示文案（仅展示；⌘K 与 / 均可用） */
  shortcut?: string
}

const props = withDefaults(defineProps<SearchProps>(), {
  modelValue: '',
  items: () => [
    '预测今晚极光强度',
    '检索太阳风数据源',
    '对比两晚观测曲线',
    '起草观测任务计划',
    '检查链路状态',
  ],
  placeholder: '搜索指令…',
  emptyTitle: '未找到匹配指令',
  shortcut: '⌘K',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', value: string): void
  (e: 'clear'): void
  (e: 'shortcut', key: 'cmd-k' | 'slash'): void
}>()

// 受控/非受控双模式
const query = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => (query.value = v),
)

const inputEl = ref<HTMLInputElement | null>(null)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items.filter((item) => item.toLowerCase().includes(q))
})
const isEmpty = computed(() => query.value.trim() !== '' && filtered.value.length === 0)

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  emit('update:modelValue', query.value)
}

function pick(item: string) {
  emit('select', item)
}

function clear() {
  query.value = ''
  emit('update:modelValue', '')
  emit('clear')
  inputEl.value?.focus()
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

// 全局快捷键：⌘K / Ctrl+K 与 /（非输入态）聚焦输入框
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    inputEl.value?.focus()
    emit('shortcut', 'cmd-k')
  } else if (e.key === '/' && !isTypingTarget(e.target)) {
    e.preventDefault()
    inputEl.value?.focus()
    emit('shortcut', 'slash')
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="yz-search">
    <div class="yz-search__card">
      <div class="yz-search__bar">
        <YzIcon name="search" :size="14" :stroke-width="2" class="yz-search__magnifier" />
        <input
          ref="inputEl"
          class="yz-search__input"
          :placeholder="placeholder"
          :aria-label="placeholder"
          :value="query"
          @input="onInput"
        />
        <button
          v-if="query"
          type="button"
          class="yz-search__clear"
          aria-label="Clear search"
          @click="clear"
        >
          <YzIcon name="close" :size="12" :stroke-width="2.2" />
        </button>
        <kbd v-else class="yz-search__kbd">{{ shortcut }}</kbd>
      </div>

      <div class="yz-search__body">
        <button
          v-for="item in filtered"
          :key="item"
          type="button"
          class="yz-search__result"
          @click="pick(item)"
        >
          {{ item }}
        </button>

        <div v-if="isEmpty" class="yz-search__empty">
          <YzIcon name="search" :size="18" :stroke-width="2" class="yz-search__empty-icon" />
          <span class="yz-search__empty-title">{{ emptyTitle }}</span>
          <span class="yz-search__empty-hint">0 hits for “{{ query.trim() }}”</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 根容器（beautifului: w-full max-w-72 flex min-h-[248px] flex-col items-stretch） */
.yz-search {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 288px;
  min-height: 248px;
}

/* 卡片（beautifului: rounded-card bg-surface shadow-raised overflow-hidden） */
.yz-search__card {
  overflow: hidden;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-raised);
}

/* 搜索栏（beautifului: flex h-10 items-center gap-2 border-b border-line px-3 hover:bg-hover） */
.yz-search__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid var(--yz-line);
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-search__bar:hover {
  background: var(--yz-hover);
}
.yz-search__magnifier {
  flex-shrink: 0;
  color: var(--yz-ink-3);
}
.yz-search__input {
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 13px;
  color: var(--yz-ink);
}
.yz-search__input::placeholder {
  color: var(--yz-ink-3);
}

/* 快捷键提示（beautifului kbd 风格） */
.yz-search__kbd {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 5px;
  border: 1px solid var(--yz-line-strong);
  border-radius: 5px;
  background: var(--yz-field);
  font-family: var(--yz-font-mono);
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* 清空按钮 */
.yz-search__clear {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.yz-search__clear:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}

/* 结果区（beautifului: p-1） */
.yz-search__body {
  padding: 4px;
}
.yz-search__result {
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: 13px;
  color: var(--yz-ink);
  cursor: pointer;
  animation: yz-fade-in 200ms ease-out both;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-search__result:hover {
  background: var(--yz-hover);
}

/* 空状态 */
.yz-search__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 20px 0 24px;
  animation: yz-fade-in 200ms ease-out both;
}
.yz-search__empty-icon {
  margin-bottom: 4px;
  color: var(--yz-ink-3);
  opacity: 0.6;
}
.yz-search__empty-title {
  font-size: 12.5px;
  color: var(--yz-ink-2);
}
.yz-search__empty-hint {
  font-family: var(--yz-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* 动效开关 */
@media (prefers-reduced-motion: reduce) {
  .yz-search__bar,
  .yz-search__clear,
  .yz-search__result {
    transition: none;
  }
  .yz-search__result,
  .yz-search__empty {
    animation: none;
  }
}
</style>
