<script setup lang="ts">
// YzRecordsTable — Records Table 记录表格（移植自 beautifului.dev Records Table）
// 数据驱动的记录表格：首列粘性 + 横向/纵向滚动，两列可排序（最近交互/连接强度），
// 行选择 + 全选（半选态），tfoot 汇总（count / average / links）全部由 rows 数据计算，
// 与行内容同源（评审 C1 I-2）；空数据有守卫（B2 Minor 教训）
import { computed, ref, watch } from 'vue'

/** 连接强度等级（beautifului 圆点色：red / orange / green / ink-3） */
export type ConnectionStrength = 'none' | 'very-weak' | 'weak' | 'strong' | 'very-strong'

export type SortKey = 'lastInteraction' | 'strength'
export type SortDir = 'asc' | 'desc'

export interface RecordTag {
  /** 标签文案（如 "极光"） */
  label: string
  /** 圆点/标签色（css color） */
  color: string
}

export interface RecordRow {
  id: string
  /** 记录名（观测站等） */
  name: string
  /** 首字母标记（默认取 name 首字符） */
  mark?: string
  /** 分类标签（缺省无） */
  tags?: RecordTag[]
  /** 上次交互文案（等宽，如 "9 days ago"） */
  lastInteraction: string
  /** 上次交互天数（排序键；缺省 0） */
  lastInteractionDays?: number
  strength: ConnectionStrength
  /** 外链（缺省显示 —） */
  link?: string
}

/** 强度等级 → 文案/圆点色/数值（汇总平均值同源；B2 守卫：未知 key 回退 none） */
const STRENGTH_LEVELS: Record<ConnectionStrength, { label: string; color: string; value: number }> = {
  none: { label: 'No communication', color: 'var(--yz-ink-3)', value: 0 },
  'very-weak': { label: 'Very weak', color: 'var(--yz-red)', value: 20 },
  weak: { label: 'Weak', color: 'var(--yz-orange)', value: 40 },
  strong: { label: 'Strong', color: 'var(--yz-green)', value: 70 },
  'very-strong': { label: 'Very strong', color: 'var(--yz-green)', value: 90 },
}

function strengthOf(strength: ConnectionStrength): { label: string; color: string; value: number } {
  return STRENGTH_LEVELS[strength] ?? STRENGTH_LEVELS.none
}

interface RecordsTableProps {
  rows?: RecordRow[]
  /** 五列表头（beautifului: Company / Categories / Last interaction / Connection strength / Links） */
  headers?: string[]
  /** 排序键（受控/非受控双模式） */
  sortKey?: SortKey | null
  sortDir?: SortDir
  /** 已选行 id（受控/非受控双模式） */
  selected?: string[]
  /** 空数据提示 */
  emptyText?: string
  /** 全选复选框无障碍标签 */
  selectAllLabel?: string
  /** 滚动容器无障碍标签 */
  scrollLabel?: string
  /** 汇总区 "Add calculation" 按钮文案 */
  addCalculationText?: string
}

const props = withDefaults(defineProps<RecordsTableProps>(), {
  rows: () => [
    {
      id: 'r1',
      name: '辉光穹顶观测站 — 特罗姆瑟',
      tags: [
        { label: '极光', color: 'var(--yz-tag-purple)' },
        { label: '磁暴', color: 'var(--yz-tag-cyan)' },
      ],
      lastInteraction: '2 days ago',
      lastInteractionDays: 2,
      strength: 'very-strong' as const,
      link: 'https://aurora-dome.example.com',
    },
    {
      id: 'r2',
      name: '极夜光谱站 — 基律纳',
      tags: [
        { label: '光谱', color: 'var(--yz-tag-blue)' },
        { label: '高纬', color: 'var(--yz-tag-green)' },
      ],
      lastInteraction: '9 days ago',
      lastInteractionDays: 9,
      strength: 'strong' as const,
      link: 'https://kiruna-spectrum.example.com',
    },
    {
      id: 'r3',
      name: '太阳风前哨 — 朗伊尔城',
      tags: [
        { label: '磁暴', color: 'var(--yz-tag-orange)' },
        { label: '传感', color: 'var(--yz-tag-red)' },
      ],
      lastInteraction: 'about 1 month ago',
      lastInteractionDays: 30,
      strength: 'weak' as const,
    },
    {
      id: 'r4',
      name: '磁力计阵列 — 阿比斯库',
      tags: [
        { label: '地磁', color: 'var(--yz-tag-pink)' },
        { label: '高纬', color: 'var(--yz-tag-green)' },
      ],
      lastInteraction: '5 months ago',
      lastInteractionDays: 150,
      strength: 'none' as const,
      link: 'https://abisko-array.example.com',
    },
    {
      id: 'r5',
      name: '极光相机网 — 罗瓦涅米',
      tags: [
        { label: '极光', color: 'var(--yz-tag-purple)' },
        { label: '影像', color: 'var(--yz-tag-cyan)' },
      ],
      lastInteraction: 'almost 2 years ago',
      lastInteractionDays: 700,
      strength: 'very-weak' as const,
    },
    {
      id: 'r6',
      name: '电离层雷达 — 索丹屈莱',
      tags: [
        { label: '雷达', color: 'var(--yz-tag-orange)' },
        { label: '监测', color: 'var(--yz-tag-blue)' },
      ],
      lastInteraction: '3 weeks ago',
      lastInteractionDays: 21,
      strength: 'strong' as const,
      link: 'https://sodankyla-radar.example.com',
    },
    {
      id: 'r7',
      name: '天顶中继站 — 纳尔维克',
      tags: [
        { label: '中继', color: 'var(--yz-tag-green)' },
        { label: '气象', color: 'var(--yz-tag-lime)' },
      ],
      lastInteraction: '1 week ago',
      lastInteractionDays: 7,
      strength: 'very-strong' as const,
      link: 'https://narvik-relay.example.com',
    },
  ],
  headers: () => ['公司', '分类', '最近交互', '连接强度', '链接'],
  sortKey: null,
  sortDir: 'asc',
  selected: () => [],
  emptyText: '暂无观测记录 · 0 条',
  selectAllLabel: 'Select all records',
  scrollLabel: '记录表格：横向与纵向滚动查看所有列与记录',
  addCalculationText: 'Add calculation',
})

const emit = defineEmits<{
  (e: 'update:sortKey', value: SortKey | null): void
  (e: 'update:sortDir', value: SortDir): void
  (e: 'sort', key: SortKey, dir: SortDir): void
  (e: 'update:selected', value: string[]): void
  (e: 'select', id: string, checked: boolean): void
  (e: 'calculate'): void
}>()

// 受控/非受控双模式（排序）
const sortKey = ref<SortKey | null>(props.sortKey)
const sortDir = ref<SortDir>(props.sortDir)
watch(
  () => props.sortKey,
  (v) => (sortKey.value = v),
)
watch(
  () => props.sortDir,
  (v) => (sortDir.value = v),
)

// 受控/非受控双模式（选择）
const selected = ref<string[]>([...props.selected])
watch(
  () => props.selected,
  (v) => (selected.value = [...(v ?? [])]),
)

function sortValue(row: RecordRow, key: SortKey): number {
  if (key === 'lastInteraction') return row.lastInteractionDays ?? 0
  return strengthOf(row.strength).value
}

const sortedRows = computed(() => {
  if (!sortKey.value) return props.rows
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows]
    .map((row, i) => ({ row, i }))
    .sort((a, b) => {
      const diff = sortValue(a.row, sortKey.value!) - sortValue(b.row, sortKey.value!)
      return diff !== 0 ? diff * dir : a.i - b.i
    })
    .map((x) => x.row)
})

function toggleSort(key: SortKey) {
  if (sortKey.value !== key) {
    sortKey.value = key
    sortDir.value = 'asc'
  } else {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  }
  emit('update:sortKey', sortKey.value)
  emit('update:sortDir', sortDir.value)
  emit('sort', sortKey.value, sortDir.value)
}

function ariaSortOf(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

// 选择逻辑（全选半选态由 DOM 属性 indeterminate 驱动）
const idSet = computed(() => new Set(props.rows.map((r) => r.id)))
const allSelected = computed(() => props.rows.length > 0 && props.rows.every((r) => selected.value.includes(r.id)))
const partial = computed(() => selected.value.length > 0 && !allSelected.value)

function isSelected(id: string): boolean {
  return selected.value.includes(id)
}

function toggleRow(id: string, checked: boolean) {
  const next = checked
    ? Array.from(new Set([...selected.value, id]))
    : selected.value.filter((x) => x !== id)
  selected.value = next
  emit('update:selected', next)
  emit('select', id, checked)
}

function toggleAll(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  const next = checked ? props.rows.filter((r) => idSet.value.has(r.id)).map((r) => r.id) : []
  selected.value = next
  emit('update:selected', next)
  if (props.rows.length > 0) emit('select', props.rows[0].id, checked)
}

function markOf(row: RecordRow): string {
  const m = row.mark || (row.name || '').trim().charAt(0)
  return m || '·'
}

// 汇总行（与 rows 数据同源：count / average / links 实时计算）
const totalCount = computed(() => props.rows.length)
const linksCount = computed(() => props.rows.filter((r) => Boolean(r.link)).length)
const averagePercent = computed(() => {
  if (props.rows.length === 0) return 0
  const sum = props.rows.reduce((acc, r) => acc + strengthOf(r.strength).value, 0)
  return Math.round(sum / props.rows.length)
})
const averageLevel = computed<ConnectionStrength>(() => {
  const v = averagePercent.value
  if (v >= 75) return 'very-strong'
  if (v >= 55) return 'strong'
  if (v >= 30) return 'weak'
  if (v >= 10) return 'very-weak'
  return 'none'
})

// 空数据守卫（B2 评审教训）
const noData = computed(() => totalCount.value === 0)
</script>

<template>
  <div class="yz-records-table">
    <!-- 滚动容器（beautifului: records-scroll，tabindex=0 + aria-label） -->
    <div class="yz-records-table__scroll" tabindex="0" :aria-label="scrollLabel">
      <table class="yz-records-table__table">
        <colgroup>
          <col class="yz-records-table__col--company" />
          <col class="yz-records-table__col--category" />
          <col class="yz-records-table__col--last" />
          <col class="yz-records-table__col--strength" />
          <col class="yz-records-table__col--link" />
        </colgroup>

        <thead>
          <tr>
            <!-- 首列：全选 + 列名（横向/纵向双粘性） -->
            <th class="yz-records-table__head yz-records-table__sticky-col yz-records-table__head--company">
              <label class="yz-records-table__check" :title="selectAllLabel">
                <input
                  type="checkbox"
                  :aria-label="selectAllLabel"
                  :checked="allSelected"
                  :indeterminate="partial"
                  @change="toggleAll"
                />
                <span
                  class="yz-records-table__box"
                  :class="{
                    'yz-records-table__box--checked': allSelected,
                    'yz-records-table__box--partial': partial,
                  }"
                />
              </label>
              <span class="yz-records-table__head-text">{{ headers[0] }}</span>
            </th>
            <!-- 分类（不可排序） -->
            <th class="yz-records-table__head">
              <span class="yz-records-table__head-static">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="m20.6 13.4-8.6 8.6-8-8V4h10l6.6 6.6a2 2 0 0 1 0 2.8zM7 7h.01" />
                </svg>
                <span class="yz-records-table__head-label">{{ headers[1] }}</span>
              </span>
            </th>
            <!-- 最近交互（可排序） -->
            <th class="yz-records-table__head" :aria-sort="ariaSortOf('lastInteraction')">
              <button
                type="button"
                class="yz-records-table__sort-btn"
                :class="{ 'yz-records-table__sort-btn--active': sortKey === 'lastInteraction' }"
                @click="toggleSort('lastInteraction')"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M3 5h18M3 12h12M3 19h7M18 15v6m-3-3h6" />
                </svg>
                <span class="yz-records-table__head-label">{{ headers[2] }}</span>
                <svg
                  class="yz-records-table__sort-arrow"
                  :class="{ 'yz-records-table__sort-arrow--asc': sortKey === 'lastInteraction' && sortDir === 'asc' }"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </button>
            </th>
            <!-- 连接强度（可排序） -->
            <th class="yz-records-table__head" :aria-sort="ariaSortOf('strength')">
              <button
                type="button"
                class="yz-records-table__sort-btn"
                :class="{ 'yz-records-table__sort-btn--active': sortKey === 'strength' }"
                @click="toggleSort('strength')"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.9z" />
                </svg>
                <span class="yz-records-table__head-label">{{ headers[3] }}</span>
                <svg
                  class="yz-records-table__sort-arrow"
                  :class="{ 'yz-records-table__sort-arrow--asc': sortKey === 'strength' && sortDir === 'asc' }"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </button>
            </th>
            <!-- 链接（不可排序） -->
            <th class="yz-records-table__head">
              <span class="yz-records-table__head-static">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
                </svg>
                <span class="yz-records-table__head-label">{{ headers[4] }}</span>
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- 空数据守卫（B2 评审教训：不报运行时错误） -->
          <tr v-if="noData" class="yz-records-table__empty-row">
            <td class="yz-records-table__cell yz-records-table__sticky-col" colspan="5">{{ emptyText }}</td>
          </tr>
          <tr v-for="row in sortedRows" v-else :key="row.id" class="yz-records-table__row">
            <td class="yz-records-table__cell yz-records-table__sticky-col yz-records-table__company-cell">
              <label class="yz-records-table__check" :title="`Select ${row.name}`">
                <input
                  type="checkbox"
                  :aria-label="`Select ${row.name}`"
                  :checked="isSelected(row.id)"
                  @change="toggleRow(row.id, ($event.target as HTMLInputElement).checked)"
                />
                <span
                  class="yz-records-table__box"
                  :class="{ 'yz-records-table__box--checked': isSelected(row.id) }"
                />
              </label>
              <span class="yz-records-table__mark" aria-hidden="true">{{ markOf(row) }}</span>
              <a
                v-if="row.link"
                class="yz-records-table__name yz-records-table__name--link"
                :href="row.link"
                target="_blank"
                rel="noreferrer"
              >{{ row.name }}</a>
              <span v-else class="yz-records-table__name">{{ row.name }}</span>
            </td>
            <td class="yz-records-table__cell">
              <div class="yz-records-table__tags">
                <span
                  v-for="tag in row.tags ?? []"
                  :key="tag.label"
                  class="yz-records-table__tag"
                  :style="{ '--yz-tag-color': tag.color }"
                >
                  <span class="yz-records-table__tag-dot" :style="{ background: tag.color }" aria-hidden="true" />
                  {{ tag.label }}
                </span>
              </div>
            </td>
            <td class="yz-records-table__cell yz-records-table__cell--mono">{{ row.lastInteraction }}</td>
            <td class="yz-records-table__cell">
              <span class="yz-records-table__strength">
                <span
                  class="yz-records-table__strength-dot"
                  :style="{ background: strengthOf(row.strength).color }"
                  aria-hidden="true"
                />
                <span class="yz-records-table__strength-label">{{ strengthOf(row.strength).label }}</span>
              </span>
            </td>
            <td class="yz-records-table__cell">
              <a
                v-if="row.link"
                class="yz-records-table__link"
                :href="row.link"
                target="_blank"
                rel="noreferrer"
              >
                {{ row.link.replace(/^https?:\/\//, '') }}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M14 5h5v5M19 5l-8 8" />
                </svg>
              </a>
              <span v-else class="yz-records-table__muted">—</span>
            </td>
          </tr>
        </tbody>

        <!-- 汇总行（beautifului: records-calculation-row；count/average/links 与 rows 同源） -->
        <tfoot>
          <tr class="yz-records-table__foot-row">
            <td class="yz-records-table__cell yz-records-table__sticky-col yz-records-table__calc-cell">
              <span class="yz-records-table__calc-number">{{ totalCount }}</span>
              <span class="yz-records-table__calc-label">count</span>
            </td>
            <td class="yz-records-table__cell">
              <button type="button" class="yz-records-table__add-calculation" @click="emit('calculate')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {{ addCalculationText }}
              </button>
            </td>
            <td class="yz-records-table__cell"><span class="yz-records-table__muted">—</span></td>
            <td class="yz-records-table__cell">
              <span class="yz-records-table__average">
                <span
                  class="yz-records-table__strength-dot"
                  :style="{ background: strengthOf(averageLevel).color }"
                  aria-hidden="true"
                />
                <span class="yz-records-table__calc-number">{{ averagePercent }}</span>
                <span class="yz-records-table__calc-label">average</span>
              </span>
            </td>
            <td class="yz-records-table__cell">
              <span class="yz-records-table__calc-number">{{ linksCount }}</span>
              <span class="yz-records-table__calc-label">links</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 根容器（beautifului: w-full max-w-120 [&>*]:mx-auto） */
.yz-records-table {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

/* 滚动容器（records-scroll：横/纵向滚动，表头与首列粘性） */
.yz-records-table__scroll {
  overflow: auto;
  max-height: 264px;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
  outline: none;
  scrollbar-width: none;
}
.yz-records-table__scroll::-webkit-scrollbar {
  display: none;
}
.yz-records-table__scroll:focus-visible {
  box-shadow: var(--yz-shadow-card), 0 0 0 2px var(--yz-accent);
}

.yz-records-table__table {
  width: 100%;
  min-width: 640px;
  border-collapse: separate;
  border-spacing: 0;
}
/* 列宽（colgroup，对齐源表格比例） */
.yz-records-table__col--company {
  width: 176px;
}
.yz-records-table__col--category {
  width: 128px;
}
.yz-records-table__col--last {
  width: 116px;
}
.yz-records-table__col--strength {
  width: 128px;
}
.yz-records-table__col--link {
  width: 148px;
}

/* 表头（beautifului: records-header-cell text-[11.5px] font-medium text-ink-3） */
.yz-records-table__head {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 0;
  border-bottom: 1px solid var(--yz-line);
  background: var(--yz-surface);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-3);
  text-align: left;
}
/* 首列表头（横+纵双粘性，层叠最高） */
.yz-records-table__head--company {
  z-index: 3;
}
.yz-records-table__sticky-col {
  position: sticky;
  left: 0;
  z-index: 1;
  background: var(--yz-surface);
  box-shadow: inset -1px 0 0 var(--yz-line);
}
.yz-records-table__head--company.yz-records-table__sticky-col {
  z-index: 3;
}
.yz-records-table__head-text {
  display: inline-flex;
  align-items: center;
  padding-right: 12px;
  white-space: nowrap;
}
.yz-records-table__head-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yz-records-table__head-static,
.yz-records-table__sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 100%;
  padding: 7px 12px;
  white-space: nowrap;
}
.yz-records-table__head-static svg,
.yz-records-table__sort-btn svg {
  flex-shrink: 0;
  color: var(--yz-ink-3);
}
.yz-records-table__sort-btn {
  width: 100%;
  border: none;
  background: transparent;
  font: inherit;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: color 100ms var(--yz-ease-out-strong), background-color 100ms var(--yz-ease-out-strong);
}
.yz-records-table__sort-btn:hover {
  background: var(--yz-hover);
  color: var(--yz-ink-2);
}
.yz-records-table__sort-btn--active {
  color: var(--yz-ink);
}
/* 排序箭头（beautifului: records-sort；升序时翻转朝上） */
.yz-records-table__sort-arrow {
  flex-shrink: 0;
  opacity: 0.55;
  transition: transform 200ms var(--yz-ease-out-strong), opacity 100ms var(--yz-ease-out-strong);
}
.yz-records-table__sort-btn--active .yz-records-table__sort-arrow {
  opacity: 1;
  color: var(--yz-accent);
}
.yz-records-table__sort-arrow--asc {
  transform: rotate(180deg);
}

/* 数据行（beautifului: records-row border-b border-line hover:bg-hover） */
.yz-records-table__row {
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-records-table__row:hover {
  background: var(--yz-hover);
}
.yz-records-table__row:hover .yz-records-table__sticky-col {
  background: var(--yz-hover);
}
.yz-records-table__cell {
  padding: 8px 12px;
  border-bottom: 1px solid var(--yz-line);
  font-size: 12px;
  color: var(--yz-ink-2);
}
.yz-records-table__row:last-child .yz-records-table__cell {
  border-bottom: 0;
}

/* 公司单元格（checkbox + mark + name） */
.yz-records-table__company-cell {
  display: table-cell;
  vertical-align: middle;
}
.yz-records-table__check {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  margin-right: 10px;
  cursor: pointer;
}
.yz-records-table__check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
/* 自定义复选框盒（beautifului: records-checkbox-box size-4 rounded-[4px]） */
.yz-records-table__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--yz-line-strong);
  background: var(--yz-surface);
  transition: background-color 120ms var(--yz-ease-out-strong), border-color 120ms var(--yz-ease-out-strong);
}
.yz-records-table__box::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--yz-accent);
  opacity: 0;
  transform: scale(0.6);
  transition: opacity 120ms var(--yz-ease-out-strong), transform 120ms var(--yz-ease-out-strong);
}
.yz-records-table__box--checked {
  border-color: var(--yz-accent);
}
.yz-records-table__box--checked::after {
  opacity: 1;
  transform: scale(1);
}
/* 半选态：短横线 */
.yz-records-table__box--partial {
  border-color: var(--yz-accent);
}
.yz-records-table__box--partial::after {
  opacity: 1;
  transform: scale(1);
  width: 8px;
  height: 2px;
  border-radius: 1px;
}
.yz-records-table__check input:focus-visible + .yz-records-table__box {
  box-shadow: 0 0 0 2px var(--yz-accent-tint);
}

/* 首字母标记（beautifului: records-company-mark） */
.yz-records-table__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  border-radius: 6px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line);
  font-size: 11px;
  font-weight: 600;
  color: var(--yz-ink-2);
  vertical-align: middle;
}
/* 名称（beautifului: records-company-name font-medium text-ink truncate） */
.yz-records-table__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 88px;
  vertical-align: middle;
  font-weight: 500;
  color: var(--yz-ink);
  text-decoration: none;
}
.yz-records-table__name--link {
  color: var(--yz-accent);
}
.yz-records-table__name--link:hover {
  text-decoration: underline;
}

/* 分类标签（beautifului: records-tag，--tag-color 驱动 tint 底 + 圆点） */
.yz-records-table__tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.yz-records-table__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 6px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--yz-tag-color) 12%, transparent);
  font-size: 11px;
  font-weight: 500;
  color: var(--yz-tag-color);
  white-space: nowrap;
}
.yz-records-table__tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  flex-shrink: 0;
}

/* 数据单元格（等宽 tabular） */
.yz-records-table__cell--mono {
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}
/* 连接强度（beautifului: records-strength 圆点 + 文案） */
.yz-records-table__strength {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}
.yz-records-table__strength-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  flex-shrink: 0;
}
.yz-records-table__strength-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 外链（beautifului: records-link，hover 高亮） */
.yz-records-table__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-2);
  text-decoration: none;
  transition: color 100ms var(--yz-ease-out-strong);
}
.yz-records-table__link:hover {
  color: var(--yz-accent);
}
.yz-records-table__link svg {
  flex-shrink: 0;
}
.yz-records-table__muted {
  color: var(--yz-ink-3);
}

/* 汇总行（beautifului: records-calculation-row） */
.yz-records-table__foot-row .yz-records-table__cell {
  border-bottom: 0;
  background: var(--yz-surface);
  padding-top: 10px;
  padding-bottom: 10px;
}
.yz-records-table__calc-cell {
  white-space: nowrap;
}
.yz-records-table__calc-number {
  font-family: var(--yz-font-mono);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink);
}
.yz-records-table__calc-label {
  margin-left: 4px;
  font-size: 12px;
  color: var(--yz-ink-3);
}
.yz-records-table__average {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.yz-records-table__average .yz-records-table__calc-number {
  font-weight: 500;
}
/* Add calculation 按钮（beautifului: records-add-calculation） */
.yz-records-table__add-calculation {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.yz-records-table__add-calculation:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}

/* 空数据守卫（等宽数据元素） */
.yz-records-table__empty-row .yz-records-table__cell {
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
  text-align: center;
  padding: 18px 12px;
}

/* 动效开关 */
@media (prefers-reduced-motion: reduce) {
  .yz-records-table__box,
  .yz-records-table__sort-btn,
  .yz-records-table__sort-arrow,
  .yz-records-table__link,
  .yz-records-table__add-calculation,
  .yz-records-table__row {
    transition: none;
  }
}
</style>
