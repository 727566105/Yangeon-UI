<script setup lang="ts">
// YzInsightCards — Insight Cards 洞察卡片（移植自 beautifului.dev Insight Cards）
// 分页洞察 + 实时趋势图表（SVG 双序列迷你走势，interval 驱动）+ 追问按钮
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

export interface InsightSegment {
  /** 普通文本段 */
  text?: string
  /** 提及对象（圆点 + @名称，beautifului: bg-orange 圆点） */
  mention?: string
  /** 等宽数据代码段 */
  code?: string
  /** 代码段色调（beautifului: text-red） */
  codeTone?: 'red' | 'green' | 'ink'
}

export interface InsightMetric {
  label: string
  /** 圆点色（beautifului: bg-orange / bg-accent） */
  dotTone: 'orange' | 'accent' | 'green' | 'red'
  /** 主数值（17px 粗体 tabular） */
  value: string
  /** 主数值色调 */
  valueTone: 'red' | 'green' | 'ink'
  /** 等宽差额 */
  delta: string
  /** 差额色调 */
  deltaTone?: 'red' | 'green' | 'ink'
}

export interface Insight {
  text: InsightSegment[]
  metrics: [InsightMetric, InsightMetric]
  /** 追问建议文案（底部胶囊按钮） */
  followUp: string
}

interface InsightCardsProps {
  insights?: Insight[]
  /** 当前洞察下标（受控/非受控双模式） */
  activeIndex?: number
  /** 图表实时数据流（false 渲染静态快照） */
  live?: boolean
}

const props = withDefaults(defineProps<InsightCardsProps>(), {
  insights: () => [
    {
      text: [
        { text: 'The worst performer in your ' },
        { mention: 'Creamery' },
        { text: ' is Rocky Road — down ' },
        { code: '-6%', codeTone: 'red' as const },
        { text: ' or ' },
        { code: '-$2,453.44', codeTone: 'red' as const },
        { text: '.' },
      ],
      metrics: [
        {
          label: 'Mint Chip',
          dotTone: 'orange' as const,
          value: '-4.41%',
          valueTone: 'red' as const,
          delta: '-$2,377.66',
          deltaTone: 'red' as const,
        },
        {
          label: 'Pistachio',
          dotTone: 'accent' as const,
          value: '+1.15%',
          valueTone: 'green' as const,
          delta: '+$617.22',
          deltaTone: 'green' as const,
        },
      ],
      followUp: 'Should I rebalance flavors?',
    },
    {
      text: [
        { text: 'The fastest mover in your ' },
        { mention: 'Polar Array' },
        { text: ' is Sorbet — up ' },
        { code: '+2.4%', codeTone: 'green' as const },
        { text: ' or ' },
        { code: '+$984.20', codeTone: 'green' as const },
        { text: ' over the last 3 days.' },
      ],
      metrics: [
        {
          label: 'Sorbet',
          dotTone: 'accent' as const,
          value: '+2.4%',
          valueTone: 'green' as const,
          delta: '+$984.20',
          deltaTone: 'green' as const,
        },
        {
          label: 'Cinnamon',
          dotTone: 'orange' as const,
          value: '-0.9%',
          valueTone: 'red' as const,
          delta: '-$371.05',
          deltaTone: 'red' as const,
        },
      ],
      followUp: 'Should I promote Sorbet next week?',
    },
    {
      text: [
        { text: 'Shelf-life risk flagged at ' },
        { mention: 'Depot B' },
        { text: ' — ' },
        { code: '14', codeTone: 'red' as const },
        { text: ' items expire before the weekend window.' },
      ],
      metrics: [
        {
          label: 'Expiring items',
          dotTone: 'orange' as const,
          value: '14',
          valueTone: 'red' as const,
          delta: '-6 vs last week',
          deltaTone: 'red' as const,
        },
        {
          label: 'Frozen stock',
          dotTone: 'accent' as const,
          value: '23%',
          valueTone: 'green' as const,
          delta: '+5% buffer',
          deltaTone: 'green' as const,
        },
      ],
      followUp: 'Should I run a clearance batch?',
    },
  ],
  activeIndex: 0,
  live: true,
})

const emit = defineEmits<{
  (e: 'update:activeIndex', value: number): void
  (e: 'change', value: number): void
  (e: 'ask', text: string): void
}>()

// 受控/非受控双模式
const innerIndex = ref(props.activeIndex)
watch(
  () => props.activeIndex,
  (v) => (innerIndex.value = v),
)

const current = computed(() => props.insights[innerIndex.value] ?? props.insights[0])

function goTo(i: number) {
  const next = Math.max(0, Math.min(props.insights.length - 1, i))
  if (next === innerIndex.value) return
  innerIndex.value = next
  emit('update:activeIndex', next)
  emit('change', next)
}
const canPrev = computed(() => innerIndex.value > 0)
const canNext = computed(() => innerIndex.value < props.insights.length - 1)

// --- 趋势图表：双序列随机游走，interval 实时追加（1200ms）---
const SERIES_COLORS = ['var(--yz-orange)', 'var(--yz-accent)']
const POINT_COUNT = 30

const seriesA = ref<number[]>([])
const seriesB = ref<number[]>([])
const tick = ref(0)
/** 序列可见性（图例开关） */
const visible = ref([true, true])
let timer: ReturnType<typeof setInterval> | null = null

const reducedMotion =
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function nextValue(last: number) {
  return Math.min(120, Math.max(10, last + (Math.random() - 0.5) * 14))
}

function buildSeries(base: number) {
  const out: number[] = []
  let v = base
  for (let i = 0; i < POINT_COUNT; i++) {
    v = nextValue(v)
    out.push(v)
  }
  return out
}

function resetData() {
  seriesA.value = buildSeries(38 + innerIndex.value * 10)
  seriesB.value = buildSeries(95 - innerIndex.value * 12)
  tick.value = 0
}

function stopLive() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function startLive() {
  if (!props.live || reducedMotion) return
  stopLive()
  timer = setInterval(() => {
    seriesA.value = [...seriesA.value.slice(1), nextValue(seriesA.value[seriesA.value.length - 1])]
    seriesB.value = [...seriesB.value.slice(1), nextValue(seriesB.value[seriesB.value.length - 1])]
    tick.value++
  }, 1200)
}

onMounted(() => {
  resetData()
  startLive()
})
watch(
  () => props.live,
  (v) => (v ? startLive() : stopLive()),
)
watch(innerIndex, () => {
  resetData()
  startLive()
})
onUnmounted(stopLive)

// SVG 折线坐标（viewBox 300x130，上下留 10px）
function pointsOf(data: number[]) {
  if (data.length < 2) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  return data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 300
      const y = 10 + (1 - (v - min) / span) * (130 - 20)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
const polyA = computed(() => pointsOf(seriesA.value))
const polyB = computed(() => pointsOf(seriesB.value))
const areaA = computed(() => `0,130 ${polyA.value} 300,130`)
const areaB = computed(() => `0,130 ${polyB.value} 300,130`)

function toggleSeries(i: number) {
  const next = [...visible.value]
  next[i] = !next[i]
  visible.value = next
}

function ask() {
  emit('ask', current.value.followUp)
}

function segToneClass(tone?: InsightSegment['codeTone']) {
  return tone === 'green' ? 'yz-insight-cards__code--green' : tone === 'red' ? 'yz-insight-cards__code--red' : ''
}
function valueToneClass(tone?: InsightMetric['valueTone']) {
  return tone === 'green' ? 'yz-insight-cards__value--green' : tone === 'red' ? 'yz-insight-cards__value--red' : ''
}
</script>

<template>
  <div class="yz-insight-cards">
    <!-- 头部：Insights + 计数 + 上一页/下一页（beautifului: size-6 rounded-[6px] chevrons） -->
    <div class="yz-insight-cards__head">
      <span class="yz-insight-cards__head-title">
        <span class="yz-insight-cards__name">Insights</span>
        <span class="yz-insight-cards__count">{{ insights.length }}</span>
      </span>
      <span class="yz-insight-cards__nav">
        <button
          type="button"
          class="yz-insight-cards__nav-btn"
          aria-label="Previous insight"
          :disabled="!canPrev"
          @click="goTo(innerIndex - 1)"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          class="yz-insight-cards__nav-btn"
          aria-label="Next insight"
          :disabled="!canNext"
          @click="goTo(innerIndex + 1)"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </span>
    </div>

    <!-- 洞察正文（切换时 key 变化重放 yz-stream-in 模糊淡入） -->
    <div :key="innerIndex" class="yz-insight-cards__body">
      <p class="yz-insight-cards__text">
        <template v-for="(seg, i) in current.text" :key="i">
          <span v-if="seg.mention" class="yz-insight-cards__mention">
            <span class="yz-insight-cards__mention-dot" aria-hidden="true" />
            @{{ seg.mention }}
          </span>
          <code
            v-else-if="seg.code"
            class="yz-insight-cards__code"
            :class="segToneClass(seg.codeTone)"
          >{{ seg.code }}</code>
          <template v-else>{{ seg.text }}</template>
        </template>
      </p>

      <!-- 图表卡片（beautifului: min-h-[278px] rounded-card bg-surface p-3 shadow-hairline） -->
      <div class="yz-insight-cards__chart-card">
        <div class="yz-insight-cards__metrics">
          <div v-for="(m, i) in current.metrics" :key="i" class="yz-insight-cards__metric">
            <span class="yz-insight-cards__metric-label">
              <span class="yz-insight-cards__metric-dot" :class="`yz-insight-cards__metric-dot--${m.dotTone}`" aria-hidden="true" />
              {{ m.label }}
            </span>
            <span class="yz-insight-cards__value" :class="valueToneClass(m.valueTone)">{{ m.value }}</span>
            <code
              class="yz-insight-cards__delta"
              :class="valueToneClass(m.deltaTone ?? m.valueTone)"
            >{{ m.delta }}</code>
          </div>
        </div>

        <!-- 趋势快照面板（beautifului: rounded-control bg-inset shadow-hairline） -->
        <div class="yz-insight-cards__panel">
          <div class="yz-insight-cards__panel-head">
            <span class="yz-insight-cards__panel-title">Trend snapshot</span>
            <span class="yz-insight-cards__panel-badge">Snapshot</span>
          </div>
          <div class="yz-insight-cards__stage">
            <!-- 图例（beautifului: 双色圆点按钮，可开关序列） -->
            <span class="yz-insight-cards__legend">
              <button
                v-for="(_, i) in SERIES_COLORS"
                :key="i"
                type="button"
                class="yz-insight-cards__legend-btn"
                :class="{ 'yz-insight-cards__legend-btn--off': !visible[i] }"
                :aria-label="`Toggle series ${i + 1}`"
                :aria-pressed="visible[i]"
                :style="{ '--yz-legend-dot': SERIES_COLORS[i] }"
                @click="toggleSeries(i)"
              />
            </span>
            <!-- SVG 迷你走势（live 时 interval 追加数据，data-tick 供测试） -->
            <svg
              class="yz-insight-cards__chart"
              :data-tick="tick"
              viewBox="0 0 300 130"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line
                v-for="g in [0.25, 0.5, 0.75]"
                :key="g"
                x1="0"
                :y1="10 + (130 - 20) * g"
                x2="300"
                :y2="10 + (130 - 20) * g"
                class="yz-insight-cards__grid"
              />
              <polygon
                v-if="visible[0]"
                :points="areaA"
                :style="{ fill: SERIES_COLORS[0] }"
                class="yz-insight-cards__area"
              />
              <polygon
                v-if="visible[1]"
                :points="areaB"
                :style="{ fill: SERIES_COLORS[1] }"
                class="yz-insight-cards__area"
              />
              <polyline
                v-if="visible[0]"
                :points="polyA"
                class="yz-insight-cards__line"
                :style="{ stroke: SERIES_COLORS[0] }"
              />
              <polyline
                v-if="visible[1]"
                :points="polyB"
                class="yz-insight-cards__line"
                :style="{ stroke: SERIES_COLORS[1] }"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 追问按钮（beautifului: mt-2 rounded-full bg-surface px-3 py-1.5 shadow-btn hover:bg-hover） -->
    <button type="button" class="yz-insight-cards__ask" @click="ask">
      {{ current.followUp }}
    </button>
  </div>
</template>

<style scoped>
/* 根容器（beautifului: min-h-[408px] w-full max-w-86） */
.yz-insight-cards {
  display: flex;
  flex-direction: column;
  min-height: 408px;
  width: 100%;
  max-width: 344px;
}

/* 头部（beautifului: flex items-center justify-between） */
.yz-insight-cards__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.yz-insight-cards__head-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.yz-insight-cards__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--yz-ink);
}
.yz-insight-cards__count {
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* 分页按钮（beautifului: size-6 rounded-[6px] text-ink-3 active:scale-[0.96]） */
.yz-insight-cards__nav {
  display: flex;
  align-items: center;
  gap: 2px;
}
.yz-insight-cards__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong),
    transform 100ms var(--yz-ease-out-strong);
}
.yz-insight-cards__nav-btn:enabled:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
.yz-insight-cards__nav-btn:enabled:active {
  transform: scale(0.96);
}
.yz-insight-cards__nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

/* 洞察正文（beautifului: transition-[opacity,filter] duration-250 → 切页重放模糊淡入） */
.yz-insight-cards__body {
  animation: yz-stream-in 250ms ease-out both;
}
.yz-insight-cards__text {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.625;
  color: var(--yz-ink-2);
}

/* 提及（beautifului: inline-flex items-center gap-1 align-baseline font-medium text-ink） */
.yz-insight-cards__mention {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: baseline;
  font-weight: 500;
  color: var(--yz-ink);
}
.yz-insight-cards__mention-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 99px;
  background: var(--yz-orange);
}

/* 数据代码段（beautifului: font-mono text-[11.5px] text-red） */
.yz-insight-cards__code {
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-red);
}
.yz-insight-cards__code--green {
  color: var(--yz-green);
}

/* 图表卡片（beautifului: mt-2 min-h-[278px] rounded-card bg-surface p-3 shadow-hairline） */
.yz-insight-cards__chart-card {
  margin-top: 8px;
  min-height: 278px;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line);
  padding: 12px;
}

/* 指标两栏（beautifului: flex items-center gap-4） */
.yz-insight-cards__metrics {
  display: flex;
  align-items: center;
  gap: 16px;
}
.yz-insight-cards__metric {
  flex: 1;
  min-width: 0;
}
.yz-insight-cards__metric-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--yz-ink-2);
}
.yz-insight-cards__metric-dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  flex-shrink: 0;
}
.yz-insight-cards__metric-dot--orange {
  background: var(--yz-orange);
}
.yz-insight-cards__metric-dot--accent {
  background: var(--yz-accent);
}
.yz-insight-cards__metric-dot--green {
  background: var(--yz-green);
}
.yz-insight-cards__metric-dot--red {
  background: var(--yz-red);
}

/* 主数值（beautifului: block text-[17px] font-semibold tracking-[-0.01em] tabular-nums） */
.yz-insight-cards__value {
  display: block;
  margin-top: 2px;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--yz-red);
}
.yz-insight-cards__value--green {
  color: var(--yz-green);
}

/* 差额（beautifului: font-mono text-[11.5px]） */
.yz-insight-cards__delta {
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-red);
}
.yz-insight-cards__delta.yz-insight-cards__value--green {
  color: var(--yz-green);
}

/* 趋势快照面板（beautifului: mt-2 overflow-hidden rounded-control bg-inset shadow-hairline） */
.yz-insight-cards__panel {
  margin-top: 8px;
  overflow: hidden;
  border-radius: var(--yz-radius-control);
  background: var(--yz-inset);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.yz-insight-cards__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-insight-cards__panel-title {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}
/* Snapshot 徽章（beautifului: rounded-full bg-field px-2 py-0.5 text-[10.5px] font-medium） */
.yz-insight-cards__panel-badge {
  border-radius: 99px;
  background: var(--yz-field);
  padding: 2px 8px;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--yz-ink-2);
}

/* 图表舞台（beautifului: insight-chart-stage relative h-[166px]，touch-action: pan-y） */
.yz-insight-cards__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 166px;
  padding: 6px 8px 8px;
  touch-action: pan-y;
}
.yz-insight-cards__legend {
  display: flex;
  align-items: center;
  gap: 6px;
}
/* 图例圆点按钮（beautifului: 6px 圆点，可开关序列） */
.yz-insight-cards__legend-btn {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 99px;
  background: var(--yz-legend-dot);
  cursor: pointer;
  opacity: 1;
  transition: opacity 150ms var(--yz-ease-out-strong), transform 150ms var(--yz-ease-out-strong);
}
.yz-insight-cards__legend-btn:hover {
  transform: scale(1.3);
}
.yz-insight-cards__legend-btn--off {
  opacity: 0.25;
}

/* SVG 图表（viewBox 300x130，等比分铺满剩余高度） */
.yz-insight-cards__chart {
  display: block;
  flex: 1;
  width: 100%;
  min-height: 0;
}
.yz-insight-cards__grid {
  stroke: var(--yz-line);
  stroke-width: 1;
  stroke-dasharray: 2 4;
  vector-effect: non-scaling-stroke;
}
.yz-insight-cards__line {
  fill: none;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}
.yz-insight-cards__area {
  fill-opacity: 0.12;
}

/* 追问按钮（beautifului: mt-2 rounded-full bg-surface px-3 py-1.5 text-left text-[12px] shadow-btn） */
.yz-insight-cards__ask {
  align-self: flex-start;
  margin-top: 8px;
  padding: 6px 12px;
  border: none;
  border-radius: 99px;
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  font-size: 12px;
  color: var(--yz-ink);
  text-align: left;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-insight-cards__ask:hover {
  background: var(--yz-hover);
}

/* 动效开关：关闭时停掉切页动画/图例过渡（实时数据流由 JS 侧 prefers-reduced-motion 守卫） */
@media (prefers-reduced-motion: reduce) {
  .yz-insight-cards__body {
    animation: none;
  }
  .yz-insight-cards__nav-btn,
  .yz-insight-cards__legend-btn,
  .yz-insight-cards__ask {
    transition: none;
  }
}
</style>
