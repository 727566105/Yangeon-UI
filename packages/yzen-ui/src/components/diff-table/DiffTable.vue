<script setup lang="ts">
// YzDiffTable — Diff Table 差异表格（移植自 beautifului.dev Diff Table）
// AI 提议的表格变更：点击行切换“接受”态（供应商单元格划线删除、行转灰），
// 卡片标题栏右侧按钮展开/折叠底部“建议插入行”（grid-rows 0fr/1fr + opacity）
import { computed, ref, watch } from 'vue'
import { YzIcon } from '../../index'

export type CategoryTone = 'accent' | 'ink' | 'green'

export interface DiffRow {
  id: string
  /** 行名（beautifului: text-[13px] font-medium tabular-nums） */
  name: string
  /** 分类 chip 文案 */
  category: string
  /** chip 圆点色调（accent 强调 / ink 中性 / green 建议新增） */
  categoryTone?: CategoryTone
  /** 数据源（等宽标识，接受变更后划线删除） */
  supplier: string
  /** 是否已接受变更（受控数据；内部点击后同步 emit update:rows） */
  applied?: boolean
}

interface DiffTableProps {
  /** 卡片标题栏文案（beautifului: text-[12.5px] font-medium text-ink） */
  title?: string
  /** 三列表头（beautifului: colgroup 34% / 30% / 36%） */
  columns?: string[]
  rows?: DiffRow[]
  /** 底部建议插入行（绿底，默认折叠）；null 隐藏 */
  proposed?: DiffRow | null
  /** 建议行展开态（受控/非受控双模式） */
  expanded?: boolean
}

const props = withDefaults(defineProps<DiffTableProps>(), {
  title: '观测任务调整建议',
  columns: () => ['观测任务', '类别', '数据源'],
  rows: () => [
    {
      id: 'r1',
      name: '北境极光校准',
      category: '重点',
      categoryTone: 'accent' as const,
      supplier: 'aurora-scoops',
    },
    {
      id: 'r2',
      name: '磁暴序列回放',
      category: '存档',
      categoryTone: 'ink' as const,
      supplier: 'kumo-creamery',
    },
    {
      id: 'r3',
      name: '极夜观测窗口',
      category: '重点',
      categoryTone: 'accent' as const,
      supplier: 'maple-orbit',
    },
  ],
  proposed: () => ({
    id: 'p1',
    name: '春分峰值预报',
    category: '新增',
    categoryTone: 'green' as const,
    supplier: 'maple-orbit',
  }),
  expanded: false,
})

const emit = defineEmits<{
  (e: 'update:rows', value: DiffRow[]): void
  (e: 'update:expanded', value: boolean): void
  (e: 'toggle', payload: { id: string; applied: boolean }): void
  (e: 'expand', expanded: boolean): void
}>()

// 受控/非受控双模式
const innerRows = ref<DiffRow[]>(props.rows)
watch(
  () => props.rows,
  (v) => (innerRows.value = v),
)
const innerExpanded = ref(props.expanded)
watch(
  () => props.expanded,
  (v) => (innerExpanded.value = v),
)

// 接受/撤销变更：受控 rows 内部修改后同步 emit update:rows
function toggleRow(row: DiffRow) {
  const next = innerRows.value.map((r) =>
    r.id === row.id ? { ...r, applied: !r.applied } : r,
  )
  innerRows.value = next
  emit('update:rows', next)
  const applied = next.find((r) => r.id === row.id)?.applied ?? false
  emit('toggle', { id: row.id, applied })
}

function toggleProposed() {
  const next = !innerExpanded.value
  innerExpanded.value = next
  emit('update:expanded', next)
  emit('expand', next)
}

// 列宽（beautifului: colgroup w-[34%]/w-[30%]/w-[36%]，超出 3 列回退 34%）
const colWidths = computed(() => props.columns.map((_, i) => [34, 30, 36][i] ?? 34))

// 空数据守卫（B2 评审教训：rows: [] 不报运行时错误）
const isEmpty = computed(() => innerRows.value.length === 0)
</script>

<template>
  <div class="yz-diff-table">
    <div class="yz-diff-table__card">
      <!-- 卡片标题栏（beautifului: primitive-card-bar border-b border-line） -->
      <div class="yz-diff-table__bar">
        <span class="yz-diff-table__bar-title">{{ title }}</span>
        <button
          v-if="proposed"
          type="button"
          class="yz-diff-table__bar-toggle"
          :aria-expanded="innerExpanded"
          aria-label="切换建议插入行"
          @click="toggleProposed"
        >
          <span class="yz-diff-table__bar-dot" aria-hidden="true" />
          <span class="yz-diff-table__bar-count">建议 +1</span>
          <YzIcon
            name="chevron-down"
            :size="12"
            :stroke-width="2.2"
            :class="{ 'yz-diff-table__chevron--open': innerExpanded }"
          />
        </button>
      </div>

      <table class="yz-diff-table__table">
        <colgroup>
          <col v-for="(w, i) in colWidths" :key="i" :style="{ width: `${w}%` }" />
        </colgroup>
        <thead>
          <tr class="yz-diff-table__head-row">
            <th v-for="c in columns" :key="c" class="yz-diff-table__th">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in innerRows"
            :key="row.id"
            class="yz-diff-table__row"
            :class="{ 'yz-diff-table__row--applied': row.applied }"
            @click="toggleRow(row)"
          >
            <td class="yz-diff-table__cell yz-diff-table__cell--name">{{ row.name }}</td>
            <td class="yz-diff-table__cell">
              <span class="yz-diff-table__chip">
                <span
                  class="yz-diff-table__dot"
                  :class="`yz-diff-table__dot--${row.categoryTone ?? 'accent'}`"
                  aria-hidden="true"
                />
                <span class="yz-diff-table__chip-label">{{ row.category }}</span>
              </span>
            </td>
            <td class="yz-diff-table__cell yz-diff-table__cell--supplier">{{ row.supplier }}</td>
          </tr>

          <!-- 空数据守卫（B2 评审教训） -->
          <tr v-if="isEmpty" class="yz-diff-table__row">
            <td colspan="3" class="yz-diff-table__empty">暂无待处理的变更</td>
          </tr>

          <!-- 建议插入行：grid-rows 0fr/1fr + opacity 折叠（beautifului: duration-400） -->
          <tr v-if="proposed">
            <td colspan="3" class="yz-diff-table__proposed-cell">
              <div
                class="yz-diff-table__collapse"
                :class="{ 'yz-diff-table__collapse--open': innerExpanded }"
              >
                <div class="yz-diff-table__viewport">
                  <div class="yz-diff-table__proposed">
                    <span class="yz-diff-table__cell yz-diff-table__cell--name yz-diff-table__proposed-name">
                      {{ proposed.name }}
                    </span>
                    <span class="yz-diff-table__cell">
                      <span class="yz-diff-table__chip yz-diff-table__chip--surface">
                        <span class="yz-diff-table__dot yz-diff-table__dot--green" aria-hidden="true" />
                        <span class="yz-diff-table__chip-label">{{ proposed.category }}</span>
                      </span>
                    </span>
                    <span class="yz-diff-table__cell yz-diff-table__proposed-supplier">
                      {{ proposed.supplier }}
                    </span>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 根容器（beautifului: w-full max-w-95） */
.yz-diff-table {
  width: 100%;
  max-width: 380px;
}

/* 卡片（beautifului: rounded-card bg-surface shadow-card） */
.yz-diff-table__card {
  overflow: hidden;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
}

/* 标题栏（beautifului: primitive-card-bar flex items-center justify-between border-b border-line px-2.5 py-2） */
.yz-diff-table__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-diff-table__bar-title {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--yz-ink);
}

/* 建议插入切换按钮 */
.yz-diff-table__bar-toggle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.yz-diff-table__bar-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--yz-green);
}
.yz-diff-table__bar-count {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-2);
  transition: color 150ms var(--yz-ease-out-strong);
}
.yz-diff-table__bar-toggle:hover .yz-diff-table__bar-count {
  color: var(--yz-ink);
}
.yz-diff-table__bar-toggle .yz-icon {
  color: var(--yz-ink-3);
  transition: transform 300ms var(--yz-ease-out-strong);
}
/* 双向旋转（transition 常驻基础类，评审 I1 教训） */
.yz-diff-table__chevron--open {
  transform: rotate(180deg);
}

/* 表格（beautifului: w-full table-fixed border-collapse text-left） */
.yz-diff-table__table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  text-align: left;
}

/* 表头（beautifului: th text-[12px] font-medium text-ink-3） */
.yz-diff-table__head-row {
  border-bottom: 1px solid var(--yz-line);
}
.yz-diff-table__th {
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-3);
}

/* 数据行（beautifului: border-b border-line transition-colors duration-400 last:border-0 hover:bg-hover） */
.yz-diff-table__row {
  border-bottom: 1px solid var(--yz-line);
  transition: background-color 400ms var(--yz-ease-out-strong);
  cursor: pointer;
}
.yz-diff-table__row:last-child {
  border-bottom: 0;
}
.yz-diff-table__row:hover {
  background: var(--yz-hover);
}
/* 已接受变更：行名转灰 + 数据源划线删除（beautifului: decoration color-mix red 50%） */
.yz-diff-table__row--applied .yz-diff-table__cell--name {
  color: var(--yz-ink-3);
}
.yz-diff-table__row--applied .yz-diff-table__cell--supplier {
  color: var(--yz-ink-3);
  text-decoration-line: line-through;
  text-decoration-color: color-mix(in srgb, var(--yz-red) 50%, transparent);
}

/* 单元格（beautifului: primitive-table-cell px-2.5 py-2） */
.yz-diff-table__cell {
  padding: 8px 10px;
  white-space: nowrap;
  transition: color 400ms var(--yz-ease-out-strong),
    text-decoration-color 400ms var(--yz-ease-out-strong);
}
.yz-diff-table__cell--name {
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink);
}
.yz-diff-table__cell--supplier {
  font-size: 12.5px;
  color: var(--yz-ink-2);
}

/* 分类 chip（beautifului: h-5.5 rounded-full bg-inset px-2 text-[11.5px] shadow-hairline） */
.yz-diff-table__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  border-radius: 99px;
  background: var(--yz-inset);
  box-shadow: 0 0 0 1px var(--yz-line);
  transition: opacity 400ms var(--yz-ease-out-strong);
}
.yz-diff-table__chip--surface {
  background: var(--yz-surface);
}
.yz-diff-table__chip-label {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-2);
}
/* 圆点（beautifului: size-1.5 rounded-full） */
.yz-diff-table__dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  flex-shrink: 0;
}
.yz-diff-table__dot--accent {
  background: var(--yz-accent);
}
.yz-diff-table__dot--ink {
  background: var(--yz-ink-3);
}
.yz-diff-table__dot--green {
  background: var(--yz-green);
}

/* 空数据守卫 */
.yz-diff-table__empty {
  padding: 16px 10px;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
  text-align: center;
}

/* 建议插入行折叠区（beautifului: transition-[grid-template-rows,opacity] duration-400；transition 常驻基础类） */
.yz-diff-table__collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 400ms var(--yz-ease-out-strong),
    opacity 400ms var(--yz-ease-out-strong);
}
.yz-diff-table__collapse--open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.yz-diff-table__viewport {
  overflow: hidden;
}

/* 建议行内容（beautifului: bg-green-tint border-t border-line grid-cols-[34%_30%_36%]） */
.yz-diff-table__proposed {
  display: grid;
  grid-template-columns: 34% 30% 36%;
  align-items: center;
  border-top: 1px solid var(--yz-line);
  background: var(--yz-green-tint);
}
.yz-diff-table__proposed-name {
  color: var(--yz-green);
}
.yz-diff-table__proposed-supplier {
  font-size: 13px;
  color: var(--yz-green);
}

/* 动效开关 */
@media (prefers-reduced-motion: reduce) {
  .yz-diff-table__row,
  .yz-diff-table__cell,
  .yz-diff-table__bar-toggle .yz-icon,
  .yz-diff-table__collapse {
    transition: none;
  }
}
</style>
