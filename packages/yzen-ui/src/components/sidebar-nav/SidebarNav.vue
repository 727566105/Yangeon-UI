<script setup lang="ts">
// YzSidebarNav — Sidebar Nav 侧边导航（移植自 beautifului.dev Sidebar Nav）
// 工作区导航：选中态随 active 项滑动的背景指示条（测量 + top/height 过渡）、
// 工作区切换折叠菜单（grid-rows 0fr/1fr）、Quick search 实时过滤 + "/" 全局快捷键
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { YzIcon } from '../../index'

export type NavIcon = 'activity' | 'checklist' | 'grid' | 'layers' | 'chart'

export interface NavItem {
  id: string
  label: string
  icon?: NavIcon
  /** 计数徽章（如 4） */
  badge?: string | number
  /** 行内 + 操作（hover 显示） */
  action?: 'add'
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export interface Workspace {
  id: string
  name: string
  subtitle: string
  /** 头像字母（beautifului: size-8 rounded-[8px] bg-ink text-surface） */
  initial: string
}

interface SidebarNavProps {
  /** 当前选中项 id（受控/非受控双模式） */
  modelValue?: string
  /** 当前工作区 id（受控/非受控双模式） */
  workspace?: string
  /** 搜索关键词（受控/非受控双模式） */
  query?: string
  workspaces?: Workspace[]
  items?: NavGroup[]
  /** 启用全局 "/" 快捷键聚焦搜索框 */
  shortcut?: boolean
}

const props = withDefaults(defineProps<SidebarNavProps>(), {
  modelValue: 'tasks',
  workspace: 'aurora',
  query: '',
  workspaces: () => [
    {
      id: 'aurora',
      name: '极光实验室',
      subtitle: 'Aurora Lab · 观测工作台',
      initial: 'A',
    },
    {
      id: 'storm',
      name: '磁暴监测组',
      subtitle: 'Storm Watch · 遥测链路',
      initial: 'S',
    },
  ],
  items: () => [
    {
      label: '工作区',
      items: [
        { id: 'home', label: '总览', icon: 'activity' as const },
        { id: 'tasks', label: '智能任务', icon: 'checklist' as const, badge: 4 },
        { id: 'inbox', label: '收件箱', icon: 'grid' as const },
      ],
    },
    {
      label: '观测对象',
      items: [
        { id: 'suppliers', label: '观测站', icon: 'layers' as const, action: 'add' as const },
        { id: 'inventory', label: '数据清单', icon: 'chart' as const },
      ],
    },
  ],
  shortcut: true,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:workspace', value: string): void
  (e: 'update:query', value: string): void
  (e: 'select', id: string): void
  (e: 'add', id: string): void
  (e: 'create'): void
  (e: 'change-workspace', id: string): void
  (e: 'shortcut', key: 'slash'): void
}>()

// --- 受控/非受控双模式 ---
const innerActive = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => (innerActive.value = v),
)
const innerWorkspace = ref(props.workspace)
watch(
  () => props.workspace,
  (v) => (innerWorkspace.value = v),
)
const innerQuery = ref(props.query)
watch(
  () => props.query,
  (v) => (innerQuery.value = v),
)

// 工作区菜单展开（grid-rows 0fr/1fr 折叠）
const menuOpen = ref(false)

const currentWorkspace = computed(() => {
  return props.workspaces.find((w) => w.id === innerWorkspace.value) ?? props.workspaces[0] ?? {
    id: '',
    name: '未命名工作区',
    subtitle: '',
    initial: '?',
  }
})

function selectWorkspace(w: Workspace) {
  innerWorkspace.value = w.id
  menuOpen.value = false
  emit('update:workspace', w.id)
  emit('change-workspace', w.id)
}

// --- 搜索过滤（隐藏不匹配项）---
const filteredGroups = computed(() => {
  const q = innerQuery.value.trim().toLowerCase()
  if (!q) return props.items
  return props.items
    .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0)
})

function onQueryInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  innerQuery.value = v
  emit('update:query', v)
  nextTick(updatePill)
}

// --- 选中态：滑动指示条（beautifului: 绝对定位 bg-hover，top/height 220ms 过渡）---
const bodyEl = ref<HTMLElement | null>(null)
const itemEls: Record<string, HTMLElement> = {}
const pillStyle = ref({ top: '0px', height: '0px', opacity: 0 })

function setItemRef(id: string, el: unknown) {
  if (el instanceof HTMLElement) itemEls[id] = el
  else delete itemEls[id]
}

function updatePill() {
  const reset = { top: '0px', height: '0px', opacity: 0 }
  if (!bodyEl.value || innerQuery.value.trim()) {
    pillStyle.value = reset
    return
  }
  const el = itemEls[innerActive.value]
  if (!el) {
    pillStyle.value = reset
    return
  }
  const bodyRect = bodyEl.value.getBoundingClientRect()
  const rect = el.getBoundingClientRect()
  pillStyle.value = {
    top: `${rect.top - bodyRect.top}px`,
    height: `${rect.height}px`,
    opacity: 1,
  }
}

function select(item: NavItem) {
  innerActive.value = item.id
  emit('update:modelValue', item.id)
  emit('select', item.id)
  nextTick(updatePill)
}

watch(innerActive, () => nextTick(updatePill))

// --- 快捷键 "/" 聚焦搜索（与 YzSearch 同一守卫：输入态不拦截）---
// 可见性门控（评审 C1 I-1）：仅当组件根元素与视口相交时才响应 "/"，
// 避免展示站同页挂载时与 YzSearch 等无条件监听 "/" 的组件冲突抢焦点
const rootEl = ref<HTMLElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)

function isInViewport(): boolean {
  const el = rootEl.value
  if (!el || typeof window === 'undefined') return false
  const rect = el.getBoundingClientRect()
  return (
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  )
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable
}

function onKeydown(e: KeyboardEvent) {
  if (!props.shortcut) return
  if (e.key === '/' && !isTypingTarget(e.target) && isInViewport()) {
    e.preventDefault()
    searchEl.value?.focus()
    emit('shortcut', 'slash')
  }
}

function onResize() {
  updatePill()
}

onMounted(() => {
  nextTick(updatePill)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onResize)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onResize)
})

// --- 行内 + 操作（hover 显示，点击不选中该行）---
function onAdd(item: NavItem) {
  emit('add', item.id)
}

// 缺失图标内联 path（stroke 风格 24 viewBox，从源 HTML 复制；icon-paths.ts 无这些图标）
const NAV_ICONS: Record<NavIcon, string> = {
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  checklist:
    '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  layers:
    '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
}

const noGroups = computed(() => filteredGroups.value.length === 0)
</script>

<template>
  <nav ref="rootEl" class="yz-sidebar-nav" aria-label="工作区导航">
    <!-- 工作区切换（beautifului: mb-2 w-full gap-2.5 rounded-control p-1.5 hover:bg-hover） -->
    <div class="yz-sidebar-nav__ws">
      <button
        type="button"
        class="yz-sidebar-nav__ws-btn"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span class="yz-sidebar-nav__ws-avatar">{{ currentWorkspace.initial }}</span>
        <span class="yz-sidebar-nav__ws-text">
          <span class="yz-sidebar-nav__ws-name">{{ currentWorkspace.name }}</span>
          <span class="yz-sidebar-nav__ws-sub">{{ currentWorkspace.subtitle }}</span>
        </span>
        <svg
          class="yz-sidebar-nav__ws-chevron"
          :class="{ 'yz-sidebar-nav__ws-chevron--open': menuOpen }"
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
          <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
        </svg>
      </button>

      <!-- 工作区菜单（grid-rows 0fr/1fr + opacity 折叠） -->
      <div
        class="yz-sidebar-nav__ws-collapse"
        :class="{ 'yz-sidebar-nav__ws-collapse--open': menuOpen }"
      >
        <div class="yz-sidebar-nav__ws-viewport">
          <div class="yz-sidebar-nav__ws-menu">
            <button
              v-for="w in workspaces"
              :key="w.id"
              type="button"
              class="yz-sidebar-nav__ws-item"
              :class="{ 'yz-sidebar-nav__ws-item--active': w.id === innerWorkspace }"
              @click="selectWorkspace(w)"
            >
              <span class="yz-sidebar-nav__ws-item-avatar">{{ w.initial }}</span>
              <span class="yz-sidebar-nav__ws-item-name">{{ w.name }}</span>
              <YzIcon v-if="w.id === innerWorkspace" name="check" :size="12" :stroke-width="2.4" class="yz-sidebar-nav__ws-item-check" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick search（beautifului: mb-1 h-8 rounded-control bg-inset px-2.5 shadow-hairline） -->
    <label class="yz-sidebar-nav__search">
      <YzIcon name="search" :size="12" :stroke-width="2" class="yz-sidebar-nav__search-icon" />
      <input
        ref="searchEl"
        class="yz-sidebar-nav__search-input"
        placeholder="Quick search"
        aria-label="Quick search"
        :value="innerQuery"
        @input="onQueryInput"
      />
      <kbd class="yz-sidebar-nav__search-kbd">/</kbd>
    </label>

    <!-- 新建任务（beautifului: mb-2 text-accent hover:bg-accent-tint） -->
    <button type="button" class="yz-sidebar-nav__new" @click="emit('create')">
      <span class="yz-sidebar-nav__new-label">新建观测任务</span>
      <span class="yz-sidebar-nav__new-plus" aria-hidden="true">
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
    </button>

    <!-- 导航区（beautifului: relative flex flex-col gap-2） -->
    <div ref="bodyEl" class="yz-sidebar-nav__body">
      <!-- 选中态滑动指示条（top/height 220ms + opacity 150ms，transition 常驻） -->
      <span
        class="yz-sidebar-nav__pill"
        aria-hidden="true"
        :style="pillStyle"
      />

      <div v-for="group in filteredGroups" :key="group.label" class="yz-sidebar-nav__group">
        <div class="yz-sidebar-nav__group-label">{{ group.label }}</div>
        <div class="yz-sidebar-nav__group-items">
          <button
            v-for="item in group.items"
            :key="item.id"
            type="button"
            class="yz-sidebar-nav__item"
            :class="{ 'yz-sidebar-nav__item--active': item.id === innerActive }"
            :ref="(el) => setItemRef(item.id, el)"
            :aria-current="item.id === innerActive ? 'page' : undefined"
            @click="select(item)"
          >
            <span class="yz-sidebar-nav__item-icon" :class="{ 'yz-sidebar-nav__item-icon--active': item.id === innerActive }">
              <svg
                v-if="item.icon"
                class="yz-sidebar-nav__item-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
                v-html="item.icon ? NAV_ICONS[item.icon] : ''"
              />
            </span>
            <span
              class="yz-sidebar-nav__item-label"
              :class="{ 'yz-sidebar-nav__item-label--active': item.id === innerActive }"
            >{{ item.label }}</span>
            <span v-if="item.badge != null" class="yz-sidebar-nav__badge">{{ item.badge }}</span>
            <span
              v-if="item.action === 'add'"
              class="yz-sidebar-nav__add"
              role="button"
              tabindex="0"
              :aria-label="`添加 ${item.label}`"
              @click.stop="onAdd(item)"
              @keydown.enter.prevent.stop="onAdd(item)"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      <!-- 空导航守卫（B2 评审教训） -->
      <div v-if="noGroups" class="yz-sidebar-nav__empty">无匹配导航项</div>
    </div>
  </nav>
</template>

<style scoped lang="scss">
/* 根容器（beautifului: w-60 rounded-card bg-surface p-2 shadow-raised） */
.yz-sidebar-nav {
  width: 240px;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-raised);
  padding: 8px;
}

/* 工作区按钮（beautifului: mb-2 flex w-full items-center gap-2.5 rounded-control p-1.5 duration-100） */
.yz-sidebar-nav__ws-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px;
  margin-bottom: 8px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong),
    transform 100ms var(--yz-ease-out-strong);
}
.yz-sidebar-nav__ws-btn:hover {
  background: var(--yz-hover);
}
.yz-sidebar-nav__ws-btn:active {
  transform: scale(0.96);
}
/* 头像（beautifului: size-8 rounded-[8px] bg-ink text-surface text-[13px] font-semibold） */
.yz-sidebar-nav__ws-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--yz-ink);
  color: var(--yz-surface);
  font-size: 13px;
  font-weight: 600;
}
.yz-sidebar-nav__ws-text {
  min-width: 0;
  flex: 1;
}
.yz-sidebar-nav__ws-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--yz-ink);
}
.yz-sidebar-nav__ws-sub {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  line-height: 1.25;
  color: var(--yz-ink-3);
}
/* 双向箭头（beautifului: 12px stroke ink-3；展开旋转 180°，transition 常驻） */
.yz-sidebar-nav__ws-chevron {
  flex-shrink: 0;
  color: var(--yz-ink-3);
  transition: transform 220ms var(--yz-ease-out-strong);
}
.yz-sidebar-nav__ws-chevron--open {
  transform: rotate(180deg);
}

/* 工作区菜单折叠（grid-rows 0fr/1fr + opacity，transition 常驻） */
.yz-sidebar-nav__ws-collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 220ms var(--yz-ease-out-strong),
    opacity 220ms var(--yz-ease-out-strong);
}
.yz-sidebar-nav__ws-collapse--open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.yz-sidebar-nav__ws-viewport {
  overflow: hidden;
}
.yz-sidebar-nav__ws-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px 8px;
}
.yz-sidebar-nav__ws-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 7px;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-sidebar-nav__ws-item:hover {
  background: var(--yz-hover);
}
.yz-sidebar-nav__ws-item-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--yz-ink);
  color: var(--yz-surface);
  font-size: 11px;
  font-weight: 600;
}
.yz-sidebar-nav__ws-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--yz-ink);
}
.yz-sidebar-nav__ws-item-check {
  color: var(--yz-accent);
}

/* 搜索条（beautifului: mb-1 flex h-8 items-center gap-2 rounded-control bg-inset px-2.5 shadow-hairline） */
.yz-sidebar-nav__search {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  margin-bottom: 4px;
  padding: 0 10px;
  border-radius: var(--yz-radius-control);
  background: var(--yz-inset);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.yz-sidebar-nav__search-icon {
  flex-shrink: 0;
  color: var(--yz-ink-3);
}
.yz-sidebar-nav__search-input {
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 12.5px;
  color: var(--yz-ink);
}
.yz-sidebar-nav__search-input::placeholder {
  color: var(--yz-ink-3);
}
/* kbd 提示（beautifului: size-4.5 rounded-[5px] bg-surface text-[10px] shadow-hairline） */
.yz-sidebar-nav__search-kbd {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
  font-family: var(--yz-font-mono);
  font-size: 10px;
  color: var(--yz-ink-3);
}

/* 新建任务（beautifului: mb-2 gap-2 rounded-control px-2 py-1.5 text-[13px] font-medium text-accent） */
.yz-sidebar-nav__new {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  margin-bottom: 8px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--yz-accent);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong),
    transform 100ms var(--yz-ease-out-strong);
}
.yz-sidebar-nav__new:hover {
  background: var(--yz-accent-tint);
}
.yz-sidebar-nav__new:active {
  transform: scale(0.96);
}
.yz-sidebar-nav__new-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}
/* 加号圆钮（beautifului: size-4 rounded-full bg-accent text-white） */
.yz-sidebar-nav__new-plus {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 99px;
  background: var(--yz-accent);
  color: #fff;
}

/* 导航区（beautifului: relative flex flex-col gap-2） */
.yz-sidebar-nav__body {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 选中态滑动指示条（beautifului: rounded-[7px] bg-hover；top/height 220ms + opacity 150ms） */
.yz-sidebar-nav__pill {
  position: absolute;
  inset-inline: 0;
  border-radius: 7px;
  background: var(--yz-hover);
  pointer-events: none;
  transition: top 220ms var(--yz-ease-out-strong), height 220ms var(--yz-ease-out-strong),
    opacity 150ms ease;
}

/* 分组（beautifului: flex flex-col gap-2） */
.yz-sidebar-nav__group {
  display: flex;
  flex-direction: column;
}
.yz-sidebar-nav__group-label {
  padding: 4px 8px 4px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--yz-ink-3);
}
.yz-sidebar-nav__group-items {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

/* 导航项（beautifului: relative z-10 flex w-full items-center gap-2 rounded-[7px] px-2 py-1.5 duration-150） */
.yz-sidebar-nav__item {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-radius: 7px;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: color 150ms var(--yz-ease-out-strong), transform 150ms var(--yz-ease-out-strong);
}
.yz-sidebar-nav__item:active {
  transform: scale(0.96);
}
.yz-sidebar-nav__item-icon {
  flex-shrink: 0;
  display: flex;
  color: var(--yz-ink-3);
}
.yz-sidebar-nav__item-icon--active {
  color: var(--yz-ink);
}
.yz-sidebar-nav__item-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  transition: color 150ms var(--yz-ease-out-strong);
  color: var(--yz-ink-2);
}
.yz-sidebar-nav__item-label--active {
  font-weight: 500;
  color: var(--yz-ink);
}

/* 计数徽章（beautifului: h-4.5 min-w-4.5 rounded-full px-1 text-[10.5px] font-semibold tabular-nums bg-surface shadow-hairline；pop-in） */
.yz-sidebar-nav__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 99px;
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-2);
  animation: yz-pop-in 250ms var(--yz-ease-out-strong) both;
}

/* 行内 + 操作（beautifului: size-4.5 rounded-[5px] opacity-0 group-hover:opacity-100 hover:bg-line/70） */
.yz-sidebar-nav__add {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  color: var(--yz-ink-3);
  opacity: 0;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong),
    color 100ms var(--yz-ease-out-strong), opacity 100ms var(--yz-ease-out-strong);
}
.yz-sidebar-nav__item:hover .yz-sidebar-nav__add,
.yz-sidebar-nav__add:focus-visible {
  opacity: 1;
}
.yz-sidebar-nav__add:hover {
  background: color-mix(in srgb, var(--yz-line) 70%, transparent);
  color: var(--yz-ink-2);
}

/* 空导航守卫（等宽数据元素） */
.yz-sidebar-nav__empty {
  padding: 10px 8px;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
  text-align: center;
}

/* 动效开关 */
@media (prefers-reduced-motion: reduce) {
  .yz-sidebar-nav__ws-btn,
  .yz-sidebar-nav__ws-chevron,
  .yz-sidebar-nav__ws-collapse,
  .yz-sidebar-nav__ws-item,
  .yz-sidebar-nav__new,
  .yz-sidebar-nav__item,
  .yz-sidebar-nav__item-label,
  .yz-sidebar-nav__add,
  .yz-sidebar-nav__pill {
    transition: none;
  }
  .yz-sidebar-nav__badge {
    animation: none;
  }
}
</style>
