<script setup lang="ts">
// YzTaskRows — Task Rows 任务行列表（移植自 beautifului.dev Task Rows）
// 实时任务状态（已完成/执行中/排队）+ 可折叠明细；
// 点击左侧状态徽章切换完成态（完成 ⇄ 排队），点击行头折叠明细
import { computed, ref, watch } from 'vue'
import { YzIcon } from '../../index'

export type TaskStatus = 'completed' | 'running' | 'queued'

export interface TaskDetail {
  label: string
  value: string
}

export interface TaskRow {
  id: string
  title: string
  /** 行右侧的等宽数据（如 "12 家供应商"） */
  meta: string
  status: TaskStatus
  /** 执行中徽章的弧线进度（0-100，默认 30） */
  progress?: number
  details?: TaskDetail[]
}

interface TaskRowsProps {
  tasks?: TaskRow[]
  /** 展示形态：capsules 独立胶囊卡片 / list 平铺行 */
  variant?: 'capsules' | 'list'
}

const props = withDefaults(defineProps<TaskRowsProps>(), {
  variant: 'capsules',
  tasks: () => [
    {
      id: 'verify',
      title: '核对传感器备案记录',
      meta: '12 台传感器',
      status: 'completed' as const,
      details: [
        { label: '匹配站点与链路 ID', value: '12/12' },
        { label: '标记过期记录', value: '0' },
      ],
    },
    {
      id: 'reorder',
      title: '生成观测任务清单',
      meta: '7 条观测序列',
      status: 'running' as const,
      progress: 28,
      details: [
        { label: '读取遥测导出', value: '3 个文件' },
        { label: '评估链路风险', value: '68%' },
      ],
    },
    {
      id: 'emails',
      title: '起草极光预报简报',
      meta: '2 份草稿',
      status: 'queued' as const,
      details: [
        { label: '峰值时段预报', value: '草稿' },
        { label: '站点备注更新', value: '草稿' },
      ],
    },
  ],
})

const emit = defineEmits<{
  (e: 'update:tasks', value: TaskRow[]): void
  (e: 'complete', payload: { id: string; completed: boolean }): void
  (e: 'expand', id: string | null): void
}>()

// 展开的任务 id（内部 UI 状态，非受控）
const openId = ref<string | null>(null)

const CIRCUMFERENCE = 2 * Math.PI * 11 // r=11 的圆周长

function arcFraction(row: TaskRow): number {
  const p = row.progress ?? 30
  return Math.max(0, Math.min(100, p)) / 100
}

// 弧线 dasharray：弧长 + 余长（beautifului: 19.35 49.76）
function dashArray(row: TaskRow): string {
  const arc = CIRCUMFERENCE * arcFraction(row)
  return `${arc.toFixed(2)} ${(CIRCUMFERENCE - arc).toFixed(2)}`
}

function toggleExpand(id: string) {
  openId.value = openId.value === id ? null : id
  emit('expand', openId.value)
}

// 完成切换：completed ⇄ queued，受控 tasks 同步 emit
function toggleComplete(row: TaskRow) {
  const completed = row.status !== 'completed'
  const next = props.tasks.map((t) =>
    t.id === row.id ? { ...t, status: completed ? ('completed' as const) : ('queued' as const) } : t,
  )
  emit('update:tasks', next)
  emit('complete', { id: row.id, completed })
}

function badgeLabel(row: TaskRow, i: number): string {
  if (row.status === 'completed') return '标记为待处理'
  return `标记完成（${row.title}）`
}

const rowClass = computed(() => `yz-task-rows__row yz-task-rows__row--${props.variant}`)
</script>

<template>
  <div class="yz-task-rows" :class="`yz-task-rows--${variant}`">
    <div v-for="(row, i) in tasks" :key="row.id" :class="rowClass">
      <div class="yz-task-rows__header" :class="{ 'yz-task-rows__header--open': openId === row.id }">
        <button
          type="button"
          class="yz-task-rows__badge"
          :class="`yz-task-rows__badge--${row.status}`"
          :aria-label="badgeLabel(row, i)"
          @click="toggleComplete(row)"
        >
          <template v-if="row.status === 'completed'">
            <span class="yz-task-rows__badge-done">
              <YzIcon name="check" :size="13" :stroke-width="3.5" />
            </span>
          </template>
          <template v-else>
            <span class="yz-task-rows__badge-ring">
              <svg
                class="yz-task-rows__ring-svg"
                :class="{ 'yz-task-rows__ring-svg--spin': row.status === 'running' }"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="11" fill="none" stroke="var(--yz-line)" stroke-width="2" />
                <circle
                  v-if="row.status === 'running'"
                  cx="12"
                  cy="12"
                  r="11"
                  fill="none"
                  stroke="var(--yz-ink-3)"
                  stroke-width="2"
                  stroke-linecap="round"
                  :stroke-dasharray="dashArray(row)"
                />
              </svg>
              <span class="yz-task-rows__badge-num">{{ i + 1 }}</span>
            </span>
          </template>
        </button>

        <button
          type="button"
          class="yz-task-rows__expand"
          :aria-expanded="openId === row.id"
          @click="toggleExpand(row.id)"
        >
          <span class="yz-task-rows__title">{{ row.title }}</span>
          <span class="yz-task-rows__meta">{{ row.meta }}</span>
          <span v-if="row.status === 'completed'" class="yz-task-rows__pill">已完成</span>
          <span aria-hidden="true" class="yz-task-rows__chevron">
            <YzIcon
              name="chevron-down"
              :size="15"
              :stroke-width="2.2"
              :class="{ 'yz-task-rows__chevron-icon--open': openId === row.id }"
            />
          </span>
        </button>
      </div>

      <div
        class="yz-task-rows__collapse"
        :class="{ 'yz-task-rows__collapse--open': openId === row.id }"
      >
        <div class="yz-task-rows__viewport">
          <div class="yz-task-rows__detail">
            <span aria-hidden="true" class="yz-task-rows__rail" />
            <div class="yz-task-rows__detail-list">
              <div v-for="(d, j) in row.details ?? []" :key="j" class="yz-task-rows__detail-item">
                <span class="yz-task-rows__detail-label">{{ d.label }}</span>
                <span class="yz-task-rows__detail-value">{{ d.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 根容器（beautifului: w-full max-w-110 flex-col gap-2） */
.yz-task-rows {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 440px;
}
.yz-task-rows--capsules {
  gap: 8px;
}

/* 行卡片（beautifului: rounded-[22px] bg-surface shadow-card，capsules ⇄ list 圆角过渡） */
.yz-task-rows__row {
  align-self: stretch;
  overflow: hidden;
  background: var(--yz-surface);
  transition: border-radius 300ms var(--yz-ease-out-strong);
}
.yz-task-rows__row--capsules {
  border-radius: 22px;
  box-shadow: var(--yz-shadow-card);
}
.yz-task-rows--list .yz-task-rows__row {
  border-radius: 0;
  background: transparent;
}
.yz-task-rows--list .yz-task-rows__row + .yz-task-rows__row {
  border-top: 1px solid var(--yz-line);
}
.yz-task-rows--list {
  border-radius: var(--yz-radius-card);
  box-shadow: var(--yz-shadow-card);
  background: var(--yz-surface);
}

/* 行头（beautifului: flex h-11 items-center gap-2.5 px-2.5 hover:bg-inset） */
.yz-task-rows__header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 10px;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-task-rows__header:hover {
  background: var(--yz-inset);
}
.yz-task-rows__header--open {
  background: var(--yz-inset);
}

/* 状态徽章（完成切换按钮） */
.yz-task-rows__badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

/* 已完成：绿色圆底白勾（beautifului: size-5.5 rounded-full bg-green pop-in） */
.yz-task-rows__badge-done {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 99px;
  background: var(--yz-green);
  color: #fff;
  animation: yz-pop-in 300ms var(--yz-ease-out-strong) both;
}

/* 执行中/排队：圆环 + 序号 */
.yz-task-rows__badge-ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.yz-task-rows__ring-svg {
  position: absolute;
  inset: 0;
}
.yz-task-rows__ring-svg--spin {
  animation: yz-spin 1.1s linear infinite;
}
.yz-task-rows__badge-num {
  position: relative;
  font-size: 10.5px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink);
}

/* 展开按钮（标题 + 数据 + 状态 pill + 箭头） */
.yz-task-rows__expand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.yz-task-rows__title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: var(--yz-ink);
}
.yz-task-rows__meta {
  flex-shrink: 0;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-2);
}
.yz-task-rows__pill {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 99px;
  background: var(--yz-green-tint);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-green);
}

/* 折叠箭头（beautifului: size-7 -ml-2 rotate 180deg；transition 常驻双向平滑，评审 I1 修复） */
.yz-task-rows__chevron {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: -8px;
  color: var(--yz-ink-3);
  transition: transform 300ms var(--yz-ease-out-strong);
}
.yz-task-rows__chevron-icon--open {
  transform: rotate(180deg);
}

/* 折叠区：grid-rows 0fr/1fr + opacity（beautifului: duration-300 cubic-bezier(0.23,1,0.32,1)） */
.yz-task-rows__collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 300ms var(--yz-ease-out-strong), opacity 300ms var(--yz-ease-out-strong);
}
.yz-task-rows__collapse--open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.yz-task-rows__viewport {
  overflow: hidden;
}

/* 明细（beautifului: grid grid-cols-[24px_1fr] gap-2.5 px-2.5 mb-2.5） */
.yz-task-rows__detail {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  padding: 0 10px;
  margin-bottom: 10px;
}
.yz-task-rows__rail {
  margin: 0 auto;
  width: 1px;
  height: 100%;
  background: var(--yz-line);
}
.yz-task-rows__detail-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.yz-task-rows__detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.yz-task-rows__detail-label {
  font-size: 12px;
  color: var(--yz-ink-2);
}
.yz-task-rows__detail-value {
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* 动效开关 */
@media (prefers-reduced-motion: reduce) {
  .yz-task-rows__row,
  .yz-task-rows__header,
  .yz-task-rows__chevron-icon--open,
  .yz-task-rows__collapse {
    transition: none;
  }
  .yz-task-rows__badge-done,
  .yz-task-rows__ring-svg--spin {
    animation: none;
  }
}
</style>
