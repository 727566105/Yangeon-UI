<script setup lang="ts">
// YzFilterTable — Filter Table 可筛选表格（移植自 beautifului.dev Filter Table）
// 状态 chips 实时重组数据：选中 chip 后其余行以 grid-rows 0fr/1fr + opacity
// 折叠动画退场，筛选计数随数据自动计算；空结果有守卫提示
import { computed, ref, watch } from 'vue'

export type FilterStatus = 'todo' | 'progress' | 'done'

export interface FilterRow {
  id: string
  /** 任务名（beautifului: truncate font-medium text-ink） */
  name: string
  /** 日期（等宽 tabular，如 "12-03"） */
  date: string
  status: FilterStatus
  /** 负责人/观测站 */
  advisor: string
}

/** 筛选 chip 定义（beautifului 圆点色：todo #f09a2f / progress #16a6c7 / done #25a878） */
export interface FilterStatusDef {
  key: FilterStatus
  label: string
  /** 圆点颜色（css color） */
  dot: string
}

interface FilterTableProps {
  rows?: FilterRow[]
  /** 当前筛选（'all' | 状态 key；受控/非受控双模式） */
  modelValue?: string
  /** 四列表头（beautifului: Task name / Date / Status / Advisor） */
  headers?: string[]
  /** 状态 chip 定义（默认 待办/进行中/已完成） */
  statuses?: FilterStatusDef[]
  /** 空结果提示文案 */
  emptyText?: string
}

const props = withDefaults(defineProps<FilterTableProps>(), {
  rows: () => [
    {
      id: 't1',
      name: '校准极光相机阵列',
      date: '12-03',
      status: 'todo' as const,
      advisor: '北极观测站',
    },
    {
      id: 't2',
      name: '解析磁暴遥测流',
      date: '09-22',
      status: 'progress' as const,
      advisor: '磁力计阵列',
    },
    {
      id: 't3',
      name: '打印本月观测排期',
      date: '01-02',
      status: 'todo' as const,
      advisor: '高纬地磁站',
    },
    {
      id: 't4',
      name: '试测批次 42 传感器',
      date: '11-08',
      status: 'progress' as const,
      advisor: '太阳风哨站',
    },
    {
      id: 't5',
      name: '订购备用滤镜组',
      date: '04-14',
      status: 'done' as const,
      advisor: '极光实验室',
    },
  ],
  modelValue: 'all',
  headers: () => ['任务', '日期', '状态', '负责人'],
  statuses: () => [
    { key: 'todo', label: '待办', dot: 'var(--yz-tag-orange)' },
    { key: 'progress', label: '进行中', dot: 'var(--yz-tag-cyan)' },
    { key: 'done', label: '已完成', dot: 'var(--yz-tag-green)' },
  ],
  emptyText: '暂无匹配任务 · 0 条',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}>()

// 受控/非受控双模式
const active = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => (active.value = v),
)

// 徽章文案兜底（评审 C1 I-2：文案从 statuses prop 反查，与 chips 标签同源；
// 仅当自定义 statuses 未覆盖某状态 key 时使用兜底）
const FALLBACK_STATUS_LABELS: Record<FilterStatus, string> = {
  todo: '待办',
  progress: '进行中',
  done: '已完成',
}

function statusLabel(status: FilterStatus): string {
  return props.statuses.find((s) => s.key === status)?.label ?? FALLBACK_STATUS_LABELS[status]
}

// 各状态计数（beautifului chip 右上角 tabular 数字）
function countOf(key: string): number {
  if (key === 'all') return props.rows.length
  return props.rows.filter((r) => r.status === key).length
}

const totalCount = computed(() => props.rows.length)

function pick(key: string) {
  if (key === active.value) return
  active.value = key
  emit('update:modelValue', key)
  emit('change', key)
}

// 是否命中当前筛选（未命中的行以 0fr + opacity 0 折叠退场）
function matches(row: FilterRow): boolean {
  return active.value === 'all' || row.status === active.value
}

// 末位可见行：去掉下边框（hidden 行仍占 DOM，border 需手动收尾）
function isLastVisible(row: FilterRow): boolean {
  const visible = props.rows.filter(matches)
  return visible[visible.length - 1]?.id === row.id
}

// 空结果守卫（B2 评审教训：筛选无命中/无数据不报错）
const emptyShown = computed(() => totalCount.value > 0 && props.rows.every((r) => !matches(r)))
const noData = computed(() => totalCount.value === 0)

// 状态徽章色调（beautifului: filter-status-*，tint 底 + 语义字色）
function statusToneClass(status: FilterStatus): string {
  return `yz-filter-table__status--${status}`
}
</script>

<template>
  <div class="yz-filter-table">
    <!-- 筛选 chips（beautifului: -mx-1 mb-1 overflow-x-auto px-1 py-1，scrollbar-width:none） -->
    <div class="yz-filter-table__chips" aria-label="按状态筛选">
      <button
        type="button"
        class="yz-filter-table__chip"
        :class="{ 'yz-filter-table__chip--active': active === 'all' }"
        :aria-selected="active === 'all'"
        :aria-pressed="active === 'all'"
        @click="pick('all')"
      >
        <span>全部</span>
        <span
          class="yz-filter-table__chip-count"
          :class="{ 'yz-filter-table__chip-count--active': active === 'all' }"
        >{{ totalCount }}</span>
      </button>
      <button
        v-for="s in statuses"
        :key="s.key"
        type="button"
        class="yz-filter-table__chip"
        :class="{ 'yz-filter-table__chip--active': active === s.key }"
        :aria-selected="active === s.key"
        :aria-pressed="active === s.key"
        @click="pick(s.key)"
      >
        <span class="yz-filter-table__chip-dot" :style="{ background: s.dot }" aria-hidden="true" />
        <span>{{ s.label }}</span>
        <span
          class="yz-filter-table__chip-count"
          :class="{ 'yz-filter-table__chip-count--active': active === s.key }"
        >{{ countOf(s.key) }}</span>
      </button>
    </div>

    <!-- 表格卡片（beautifului: overflow-x-auto rounded-card bg-surface shadow-card） -->
    <div
      class="yz-filter-table__card"
      role="region"
      aria-label="可滚动任务表格"
      tabindex="0"
    >
      <div class="yz-filter-table__inner">
        <!-- 表头（beautifului: grid-cols-[1.3fr_0.6fr_0.95fr_0.9fr] px-3 py-2 text-[11.5px]） -->
        <div class="yz-filter-table__head">
          <span v-for="h in headers" :key="h" class="yz-filter-table__head-cell">{{ h }}</span>
        </div>

        <!-- 数据行：每行独立 grid 折叠容器，筛选时 0fr 退场（beautifului: duration-300） -->
        <div
          v-for="row in rows"
          :key="row.id"
          class="yz-filter-table__row-wrap"
          :class="{ 'yz-filter-table__row-wrap--hidden': !matches(row) }"
        >
          <div class="yz-filter-table__row-viewport">
            <div
              class="yz-filter-table__row"
              :class="{ 'yz-filter-table__row--last': isLastVisible(row) }"
            >
              <span class="yz-filter-table__cell yz-filter-table__cell--name">{{ row.name }}</span>
              <span class="yz-filter-table__cell yz-filter-table__cell--date">{{ row.date }}</span>
              <span class="yz-filter-table__cell">
                <span class="yz-filter-table__status" :class="statusToneClass(row.status)">
                  {{ statusLabel(row.status) }}
                </span>
              </span>
              <span class="yz-filter-table__cell yz-filter-table__cell--advisor">{{ row.advisor }}</span>
            </div>
          </div>
        </div>

        <!-- 空数据守卫（B2 评审教训） -->
        <div v-if="noData || emptyShown" class="yz-filter-table__empty">{{ emptyText }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 根容器（beautifului: w-full max-w-105） */
.yz-filter-table {
  width: 100%;
  max-width: 420px;
}

/* 筛选 chips 行（beautifului: -mx-1 mb-1 flex items-center gap-1 overflow-x-auto px-1 py-1） */
.yz-filter-table__chips {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 -4px 4px;
  padding: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}
.yz-filter-table__chips::-webkit-scrollbar {
  display: none;
}

/* chip（beautifului: h-6.5 rounded-full px-2.5 text-[12px] font-medium duration-200） */
.yz-filter-table__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 99px;
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-2);
  cursor: pointer;
  transition: background-color 200ms var(--yz-ease-out-strong),
    box-shadow 200ms var(--yz-ease-out-strong), color 200ms var(--yz-ease-out-strong);
}
.yz-filter-table__chip:hover {
  background: var(--yz-hover);
}
.yz-filter-table__chip--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
}
.yz-filter-table__chip--active:hover {
  background: var(--yz-surface);
}
.yz-filter-table__chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  flex-shrink: 0;
}
/* 计数徽章（beautifului: rounded-[4px] px-1 text-[10.5px] tabular-nums） */
.yz-filter-table__chip-count {
  border-radius: 4px;
  padding: 0 4px;
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}
.yz-filter-table__chip-count--active {
  background: var(--yz-field);
  color: var(--yz-ink-2);
}

/* 表格卡片（beautifului: overflow-x-auto rounded-card bg-surface shadow-card） */
.yz-filter-table__card {
  overflow-x: auto;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
  scrollbar-width: none;
}
.yz-filter-table__card::-webkit-scrollbar {
  display: none;
}
.yz-filter-table__inner {
  min-width: 420px;
}

/* 表头（beautifului: grid grid-cols-[1.3fr_0.6fr_0.95fr_0.9fr] border-b border-line px-3 py-2 text-[11.5px] font-medium text-ink-3） */
.yz-filter-table__head {
  display: grid;
  grid-template-columns: 1.3fr 0.6fr 0.95fr 0.9fr;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--yz-line);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-3);
}

/* 行折叠容器（beautifului: transition-[grid-template-rows,opacity] duration-300；transition 常驻基础类） */
.yz-filter-table__row-wrap {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition: grid-template-rows 300ms var(--yz-ease-out-strong),
    opacity 300ms var(--yz-ease-out-strong);
}
.yz-filter-table__row-wrap--hidden {
  grid-template-rows: 0fr;
  opacity: 0;
}
.yz-filter-table__row-viewport {
  overflow: hidden;
}

/* 数据行（beautifului: grid grid-cols-[1.3fr_0.6fr_0.95fr_0.9fr] items-center border-b border-line px-3 py-2 text-[12px] hover:bg-hover） */
.yz-filter-table__row {
  display: grid;
  grid-template-columns: 1.3fr 0.6fr 0.95fr 0.9fr;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--yz-line);
  font-size: 12px;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-filter-table__row:hover {
  background: var(--yz-hover);
}
.yz-filter-table__row--last {
  border-bottom: 0;
}
.yz-filter-table__cell {
  min-width: 0;
}
.yz-filter-table__cell--name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: var(--yz-ink);
}
.yz-filter-table__cell--date {
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-2);
}
.yz-filter-table__cell--advisor {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--yz-ink-2);
}

/* 状态徽章（beautifului: h-5 rounded-[5px] px-1.5 text-[11px] font-medium filter-status-*） */
.yz-filter-table__status {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 500;
}
.yz-filter-table__status--todo {
  background: var(--yz-orange-tint);
  color: var(--yz-orange);
}
.yz-filter-table__status--progress {
  background: color-mix(in srgb, var(--yz-tag-cyan) 14%, transparent);
  color: var(--yz-tag-cyan);
}
.yz-filter-table__status--done {
  background: var(--yz-green-tint);
  color: var(--yz-green);
}

/* 空结果守卫（等宽数据元素） */
.yz-filter-table__empty {
  padding: 18px 12px;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
  text-align: center;
}

/* 动效开关 */
@media (prefers-reduced-motion: reduce) {
  .yz-filter-table__chip,
  .yz-filter-table__row,
  .yz-filter-table__row-wrap {
    transition: none;
  }
}
</style>
