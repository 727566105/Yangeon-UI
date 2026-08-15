<script setup lang="ts">
// YzTabs — Tabs 标签页（antd Tabs + Segmented 指示器对齐移植为 Vue 3 + Yzen 规范）
// items（key/label/content）驱动；指示器对齐 align（center/start/end）由
// indicatorShrink 缩短宽度（对应 antd indicator.size = origin - n 的语义）。
// type：line（默认下划线）/ card（卡片式）/ editable-card（可编辑卡片，+ 添加 / × 关闭）；
// size：small / medium / large 三档。
import { computed, ref, watch } from 'vue'

export interface TabItem {
  /** 唯一 key（激活态与事件依据） */
  key: string
  /** 标签文本 */
  label: string
  /** 面板内容文本 */
  content?: string
}

interface TabsProps {
  /** 标签页列表（顺序即展示顺序） */
  items?: TabItem[]
  /** 指示器对齐方式：center（默认）/ start（左对齐）/ end（右对齐），仅 line 类型生效 */
  align?: 'center' | 'start' | 'end'
  /** 指示器缩短量（px），0 为不缩短 */
  indicatorShrink?: number
  /** 受控激活 key（v-model:activeKey）；缺省时内部自管理（antd defaultActiveKey 语义） */
  activeKey?: string
  /** 标签页样式：line（默认）/ card（卡片式）/ editable-card（可编辑卡片式） */
  type?: 'line' | 'card' | 'editable-card'
  /** 尺寸：small / medium（默认）/ large */
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<TabsProps>(), {
  items: () => [],
  align: 'center',
  indicatorShrink: 0,
  activeKey: '',
  type: 'line',
  size: 'medium',
})

const emit = defineEmits<{
  (e: 'update:activeKey', key: string): void
  (e: 'change', key: string): void
  /** 可编辑卡片：点击 + 添加（由父级追加 items） */
  (e: 'add'): void
  /** 可编辑卡片：点击标签 × 关闭（由父级移除 items） */
  (e: 'remove', key: string): void
}>()

// 激活 key：受控（props.activeKey）优先，否则内部自管理并默认选中第一个
const internalKey = ref('')
watch(
  () => props.items,
  (items) => {
    if (!props.activeKey && items?.length && !internalKey.value) {
      internalKey.value = items[0].key
    }
  },
  { immediate: true },
)
const activeKey = computed(() => props.activeKey || internalKey.value || props.items[0]?.key || '')

function select(key: string) {
  if (key === activeKey.value) return
  if (props.activeKey) {
    emit('update:activeKey', key)
  } else {
    internalKey.value = key
  }
  emit('change', key)
}

function close(key: string) {
  emit('remove', key)
}

// 指示器定位（仅 line 类型）：测量激活 tab 的 offsetLeft/offsetWidth，按对齐方式计算
// （width = tab 宽 - shrink；start 左边缘对齐、end 右边缘对齐、center 居中）
const tabEls = ref<Record<string, HTMLElement | null>>({})
const indicatorStyle = computed(() => {
  if (props.type !== 'line') return { display: 'none' }
  const el = tabEls.value[activeKey.value]
  if (!el) return { display: 'none' }
  const w = Math.max(0, el.offsetWidth - props.indicatorShrink)
  const left =
    props.align === 'start'
      ? el.offsetLeft
      : props.align === 'end'
        ? el.offsetLeft + el.offsetWidth - w
        : el.offsetLeft + (el.offsetWidth - w) / 2
  return { transform: `translateX(${left}px)`, width: `${w}px` }
})

const activeContent = computed(
  () => props.items.find((t) => t.key === activeKey.value)?.content ?? '',
)
</script>

<template>
  <div class="yz-tabs" :class="[`yz-tabs--${props.align}`, `yz-tabs--${props.size}`, `yz-tabs--${props.type}`]">
    <div class="yz-tabs__nav" :class="`yz-tabs__nav--${props.type}`" role="tablist">
      <button
        v-for="tab in props.items"
        :key="tab.key"
        type="button"
        role="tab"
        class="yz-tabs__tab"
        :class="{ 'yz-tabs__tab--active': activeKey === tab.key }"
        :aria-selected="activeKey === tab.key"
        :ref="(el) => { tabEls[tab.key] = (el as HTMLElement | null) }"
        @click="select(tab.key)"
      >
        {{ tab.label }}
        <span
          v-if="props.type === 'editable-card'"
          class="yz-tabs__close"
          role="button"
          :aria-label="`关闭 ${tab.label}`"
          @click.stop="close(tab.key)"
        >×</span>
      </button>
      <button
        v-if="props.type === 'editable-card'"
        class="yz-tabs__add"
        type="button"
        :aria-label="'添加标签页'"
        @click="emit('add')"
      >+</button>
      <span
        v-if="props.type === 'line'"
        class="yz-tabs__indicator"
        aria-hidden="true"
        :style="indicatorStyle"
      />
    </div>
    <div class="yz-tabs__panel" role="tabpanel">{{ activeContent }}</div>
  </div>
</template>

<style scoped>
.yz-tabs {
  width: 100%;
  font-family: var(--yz-font-sans);
  text-align: center;
}
.yz-tabs__nav {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 2px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-tabs__tab {
  border: none;
  background: transparent;
  padding: 8px 14px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--yz-ink-3);
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms var(--yz-ease-out-strong);
}
.yz-tabs__tab:hover {
  color: var(--yz-ink-2);
}
.yz-tabs__tab--active {
  color: var(--yz-ink);
  font-weight: 600;
}
/* 尺寸三档（antd size 语义） */
.yz-tabs--small .yz-tabs__tab {
  padding: 4px 10px;
  font-size: 12px;
}
.yz-tabs--large .yz-tabs__tab {
  padding: 12px 18px;
  font-size: 14px;
}
/* 卡片式（card / editable-card）：激活项白底浮起，下边线收进卡片 */
.yz-tabs__nav--card {
  gap: 6px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-tabs__nav--card .yz-tabs__tab {
  border: 1px solid var(--yz-line-strong);
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: transparent;
}
.yz-tabs__nav--card .yz-tabs__tab:hover {
  color: var(--yz-ink);
  background: var(--yz-hover);
}
.yz-tabs__nav--card .yz-tabs__tab--active {
  position: relative;
  top: 1px;
  background: var(--yz-surface);
  color: var(--yz-ink);
  border-bottom: 1px solid var(--yz-surface);
  box-shadow: 0 -1px 2px rgba(16, 24, 40, 0.05);
}
/* 可编辑：标签关闭按钮 + 添加按钮 */
.yz-tabs__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 6px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.yz-tabs__close:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
.yz-tabs__add {
  border: none;
  background: transparent;
  padding: 2px 10px;
  font-family: inherit;
  font-size: 15px;
  line-height: 1;
  color: var(--yz-ink-3);
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.yz-tabs__add:hover {
  background: var(--yz-hover);
  color: var(--yz-accent);
}
/* 渐变指示条（仅 line 类型）：accent → 淡化，随对齐方式与缩短量平滑过渡。
   left:0 显式固定 transform 基准——absolute 元素若不设 left，基准取 flex
   容器的 static position（justify-content:center 下会跑到容器中点，指示器错位） */
.yz-tabs__indicator {
  position: absolute;
  left: 0;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    var(--yz-accent),
    color-mix(in srgb, var(--yz-accent) 55%, transparent)
  );
  transition: transform 200ms var(--yz-ease-out-strong), width 200ms var(--yz-ease-out-strong);
}
.yz-tabs__panel {
  padding: 14px 2px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--yz-ink-2);
}
</style>
