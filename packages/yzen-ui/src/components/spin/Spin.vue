<script setup lang="ts">
// YzSpin — 加载中（antd Spin 移植为 Vue 3 + Yzen 规范）
// percent 数字模式：≤0 显示经典 4 点旋转；>0 淡出旋转点、渲染 SVG 圆环进度弧
// （顶部起点、圆头线帽，dasharray 按 clamp(percent,0,100) 计算）。
// percent="auto"：内部 200ms 定时器分桶减速模拟「永不停止」的进度（先快后慢）。
import { computed, onBeforeUnmount, ref, useSlots, watch } from 'vue'

/** auto 模式分桶：进度 <=limit 时每步递增 剩余*stepPtg（antd 同款，先快后慢） */
const AUTO_STEP_BUCKETS: [number, number][] = [
  [30, 0.05],
  [70, 0.03],
  [96, 0.01],
]
const AUTO_INTERVAL = 200

interface SpinProps {
  /** 尺寸：small / medium（默认）/ large */
  size?: 'small' | 'medium' | 'large'
  /** 进度：0-100 数字（≤0 显示旋转点）或 'auto'（自动循环预估进度） */
  percent?: number | 'auto'
  /** 是否旋转加载（false 时隐藏指示器） */
  spinning?: boolean
  /** 指示器下方说明文字（容器模式下显示在覆盖层内） */
  tip?: string
}

const props = withDefaults(defineProps<SpinProps>(), {
  size: 'medium',
  percent: 0,
  spinning: true,
  tip: '',
})

// auto 模式：mockPercent 按分桶递增（antd usePercent 同款）
const mockPercent = ref(0)
let autoTimer: ReturnType<typeof setInterval> | null = null
const isAuto = computed(() => props.percent === 'auto')

watch(
  () => [isAuto.value, props.spinning],
  ([auto, spinning]) => {
    stopAuto()
    if (auto && spinning) {
      mockPercent.value = 0
      autoTimer = setInterval(() => {
        mockPercent.value = ((prev) => {
          const rest = 100 - prev
          for (const [limit, step] of AUTO_STEP_BUCKETS) {
            if (prev <= limit) return prev + rest * step
          }
          return prev
        })(mockPercent.value)
      }, AUTO_INTERVAL)
    }
  },
  { immediate: true },
)

function stopAuto() {
  if (autoTimer) {
    clearInterval(autoTimer)
    autoTimer = null
  }
}
onBeforeUnmount(stopAuto)

// 合并后的进度：auto → mockPercent；数字直接透传（clamp 在渲染层做）
const mergedPercent = computed(() => (isAuto.value ? mockPercent.value : props.percent))
const safePercent = computed(() => Math.min(Math.max(mergedPercent.value, 0), 100))

// 圆环参数（antd Progress 同款：viewBox 100，圆环宽 20）
const CIRCUMFERENCE = 50 * 2 * Math.PI
const circleStyle = computed(() => ({
  strokeDashoffset: `${CIRCUMFERENCE / 4}px`,
  strokeDasharray: `${(CIRCUMFERENCE * safePercent.value) / 100}px ${(CIRCUMFERENCE * (100 - safePercent.value)) / 100}px`,
}))

// 容器模式：存在插槽内容时，外层提供定位上下文 + 内容遮罩（antd nesting 语义）
const slots = useSlots()
const hasContent = computed(() => !!slots.default)

const classes = computed(() => [
  'yz-spin',
  `yz-spin--${props.size}`,
  { 'yz-spin--standalone': !hasContent.value },
  { 'yz-spin--spinning': props.spinning },
])
</script>

<template>
  <div :class="classes" role="status" aria-live="polite" :aria-busy="spinning">
    <!-- 容器模式：内容区（spinning 时半透明 + ::after 遮罩） -->
    <div
      v-if="hasContent"
      class="yz-spin__container"
      :class="{ 'yz-spin__container--spinning': spinning }"
    >
      <slot />
    </div>
    <!-- 指示器覆盖层：容器模式 absolute 居中盖在内容上；独立模式随文档流 -->
    <div
      v-if="spinning"
      class="yz-spin__section"
      :class="{ 'yz-spin__section--nested': hasContent }"
    >
      <!-- 旋转点：percent > 0 时缩隐（antd holder-hidden） -->
      <span
        class="yz-spin__dot-holder"
        :class="{ 'yz-spin__dot-holder--hidden': safePercent > 0 }"
      >
        <span class="yz-spin__dot">
          <i v-for="n in 4" :key="n" class="yz-spin__item" />
        </span>
      </span>
      <!-- 进度环：percent > 0 时渲染，clamp 到 0-100 -->
      <span v-if="safePercent > 0" class="yz-spin__progress">
        <svg viewBox="0 0 100 100" role="progressbar" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="safePercent">
          <circle class="yz-spin__circle yz-spin__circle--bg" r="45" cx="50" cy="50" stroke-width="20" />
          <circle class="yz-spin__circle" r="45" cx="50" cy="50" stroke-width="20" :style="circleStyle" />
        </svg>
      </span>
      <p v-if="tip" class="yz-spin__tip">{{ tip }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.yz-spin {
  position: relative;
  color: var(--yz-accent);
  --yz-spin-size: 20px; /* medium（antd dotSize = controlHeightLG/2） */
  --yz-spin-item: 9px; /* (size - 2px) / 2 */
}
/* 独立模式（无插槽）：inline-flex 垂直居中指示器 */
.yz-spin--standalone {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.yz-spin--small { --yz-spin-size: 14px; --yz-spin-item: 6px; }
.yz-spin--large { --yz-spin-size: 32px; --yz-spin-item: 15px; }

/* 容器模式：内容区 + spinning 时半透明 + ::after 遮罩（antd nesting） */
.yz-spin__container {
  position: relative;
  transition: opacity var(--yz-duration) var(--yz-ease-out-strong);
}
.yz-spin__container::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--yz-surface);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--yz-duration) var(--yz-ease-out-strong);
}
.yz-spin__container--spinning {
  opacity: 0.5;
  user-select: none;
  pointer-events: none;
}
.yz-spin__container--spinning::after {
  opacity: 0.4;
  pointer-events: auto;
}

.yz-spin__section {
  display: inline-flex;
  align-items: center;
  flex-direction: column;
  gap: 8px;
  color: var(--yz-accent);
}
/* 容器模式覆盖层：absolute 居中盖在内容上（antd section top 50% left 50%） */
.yz-spin__section--nested {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

/* 旋转点容器：1em × 1em（antd dot-holder） */
.yz-spin__dot-holder {
  display: inline-block;
  width: 1em;
  height: 1em;
  font-size: var(--yz-spin-size);
  line-height: 1;
  transform-origin: 50% 50%;
  transition: transform var(--yz-duration) var(--yz-ease-out-strong), opacity var(--yz-duration) var(--yz-ease-out-strong);
}
.yz-spin__dot-holder--hidden {
  transform: scale(0.3);
  opacity: 0;
}

/* 旋转点：45° 基准 + 405° 循环（antd antRotate） */
.yz-spin__dot {
  position: relative;
  display: inline-block;
  width: 1em;
  height: 1em;
  font-size: var(--yz-spin-size);
  transform: rotate(45deg);
  animation: yz-spin-rotate 1.2s linear infinite;
}

/* 四个角上的方块：opacity 交替点亮（antd antSpinMove） */
.yz-spin__item {
  position: absolute;
  display: block;
  width: var(--yz-spin-item);
  height: var(--yz-spin-item);
  background: currentColor;
  border-radius: 100%;
  transform: scale(0.75);
  transform-origin: 50% 50%;
  opacity: 0.3;
  animation: yz-spin-move 1s linear infinite alternate;
}
.yz-spin__item:nth-child(1) { top: 0; left: 0; animation-delay: 0s; }
.yz-spin__item:nth-child(2) { top: 0; right: 0; animation-delay: 0.4s; }
.yz-spin__item:nth-child(3) { right: 0; bottom: 0; animation-delay: 0.8s; }
.yz-spin__item:nth-child(4) { bottom: 0; left: 0; animation-delay: 1.2s; }

@keyframes yz-spin-rotate {
  to { transform: rotate(405deg); }
}
@keyframes yz-spin-move {
  to { opacity: 1; }
}

/* 进度环：SVG 覆盖在旋转点位置（antd dot-progress） */
.yz-spin__progress {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.yz-spin__progress svg {
  width: 1em;
  height: 1em;
  font-size: var(--yz-spin-size);
}
.yz-spin__circle {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  transition:
    stroke-dashoffset var(--yz-duration) var(--yz-ease-out-strong),
    stroke-dasharray var(--yz-duration) var(--yz-ease-out-strong);
}
.yz-spin__circle--bg {
  stroke: var(--yz-line-strong);
}

.yz-spin__tip {
  margin: 0;
  font-size: 13px;
  line-height: 1;
  color: var(--yz-ink-2);
}
</style>
