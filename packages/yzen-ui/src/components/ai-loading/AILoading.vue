<script setup lang="ts">
// YzAILoading — AI 智能加载（移植自 beautifului.dev Loading State，按源码精确复刻）
// 三形态共用 3×3 网格：
//   Drive — 方格子，chevron 波形前沿向右推进（650ms 周期短于扫掠，双前沿同飞）
//   Dots  — 同波形，圆形格子
//   Orbit — 彗星沿网格周界绕行（950ms，非轨道格冻结暗态）
// 配渐变扫光文字 + 等宽计时器（≥60s 显示 "Xm Y.Ys"）；reduced motion 冻结网格，计时照走
import { computed, onMounted, onUnmounted, ref } from 'vue'

interface AILoadingProps {
  variant?: 'drive' | 'dots' | 'orbit'
  label?: string
  timer?: boolean
}

const props = withDefaults(defineProps<AILoadingProps>(), {
  variant: 'drive',
  label: 'Churning',
  timer: true,
})

// chevron 波形延迟（源码: (c + |r-1|) * 90）
const chevronDelays = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3)
  const c = i % 3
  return (c + Math.abs(r - 1)) * 90
})

// Orbit 周界绕行（源码: [0,1,2,5,8,7,6,3]，k*110ms；中心格 null 冻结）
const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3]
const orbitDelays = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i)
  return k === -1 ? null : k * 110
})

// 形态参数表（源码 PATTERNS）
const PATTERNS = {
  drive: { delays: chevronDelays, dur: 650, round: false },
  dots: { delays: chevronDelays, dur: 650, round: true },
  orbit: { delays: orbitDelays, dur: 950, round: false },
} as const

const pattern = computed(() => PATTERNS[props.variant] ?? PATTERNS.drive)

// 计时器（源码 useElapsed：100ms 步进，≥60s 换 "Xm Y.Ys" 格式）
const ds = ref(0)
let interval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (!props.timer) return
  interval = setInterval(() => {
    ds.value += 1
  }, 100)
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const elapsedText = computed(() => {
  const total = ds.value / 10
  if (total < 60) return `${total.toFixed(1)}s`
  return `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`
})
</script>

<template>
  <div class="yz-ai-loading" role="status" aria-live="polite">
    <span aria-hidden="true" class="yz-ai-loading__grid">
      <span
        v-for="(delay, i) in pattern.delays"
        :key="i"
        class="yz-ai-loading__cell"
        :class="{
          'yz-ai-loading__cell--round': pattern.round,
          'yz-ai-loading__cell--frozen': delay === null,
        }"
        :style="
          delay === null
            ? undefined
            : { animation: `yz-pixel-on ${pattern.dur}ms ease-in-out ${delay}ms infinite` }
        "
      />
    </span>
    <span class="yz-ai-loading__shimmer">{{ label }}</span>
    <span class="yz-ai-loading__timer">{{ elapsedText }}</span>
  </div>
</template>

<style scoped>
/* 布局（源码: flex w-fit items-center gap-2.5） */
.yz-ai-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
}

/* 3×3 网格（源码: grid grid-cols-[repeat(3,4px)] gap-[1.5px]） */
.yz-ai-loading__grid {
  display: grid;
  grid-template-columns: repeat(3, 4px);
  gap: 1.5px;
}

/* 单元格（源码: size-[4px] bg-ink；方/圆由形态决定） */
.yz-ai-loading__cell {
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: var(--yz-ink);
  opacity: 0.15;
}
.yz-ai-loading__cell--round {
  border-radius: 99px;
}
/* 冻结格（Orbit 中心，源码: opacity 0.07 + animation none） */
.yz-ai-loading__cell--frozen {
  opacity: 0.07;
}

/* 渐变扫光文字（源码: bg-clip-text + shimmer-text 1.4s linear） */
.yz-ai-loading__shimmer {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  background-image: linear-gradient(90deg, var(--yz-ink-3) 35%, var(--yz-ink) 50%, var(--yz-ink-3) 65%);
  background-size: 200% 100%;
  animation: yz-shimmer-text 1.4s linear infinite;
}

/* 计时器（源码: font-mono text-[12px] text-ink-3 tabular-nums） */
.yz-ai-loading__timer {
  font-family: var(--yz-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* reduced motion：网格冻结暗态，计时器照走（源码注释明确） */
@media (prefers-reduced-motion: reduce) {
  .yz-ai-loading__cell,
  .yz-ai-loading__shimmer {
    animation: none;
  }
}
</style>
