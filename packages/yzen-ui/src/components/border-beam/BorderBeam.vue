<script setup lang="ts">
// YzBorderBeam — 边框光束（antd BorderBeam 移植为 Vue 3 + Yzen 规范）
// 渐变光束沿容器边缘循环流动：CSS Motion Path（offset-path: rect() + offset-distance
// 动画）驱动光斑沿边框行走，mask-composite: exclude 只暴露边框环区域。
// color 接受单个色值或 {color, percent}[] 渐变 stops（percent 为 0-100 输入范围，
// 内部等比缩放到可见光束段 0-70%，尾部保留透明淡出）。
import { computed } from 'vue'
import { getBorderBeamGradient } from './util'
import type { BorderBeamStop } from './util'

interface BorderBeamProps {
  /** 光束渐变：单个色值或 {color, percent}[] 渐变 stops */
  color?: string | BorderBeamStop[]
  /** 光束数量（>1 时负延迟均匀错开，形成多束同跑） */
  count?: number
  /** 每圈时长（秒） */
  duration?: number
  /** 光束线宽（px） */
  lineWidth?: number
  /** 光束方块边长（px），须小于容器短边两倍避免同时盖住对边 */
  size?: number
  /** 光束层与容器边缘的距离（px），正数向外扩（盖住容器边框） */
  outset?: number
  /** 圆角（px），光束沿圆角行走 */
  radius?: number
}

const props = withDefaults(defineProps<BorderBeamProps>(), {
  color: undefined,
  count: 1,
  duration: 6,
  lineWidth: 1,
  size: 100,
  outset: 0,
  radius: 0,
})

const gradient = computed(() => getBorderBeamGradient(props.color))
// 多光束：第 i 条延迟 -duration*i/count（与 antd 同款负延迟均匀错开）。
// 非法 count（NaN/Infinity/负数/0）兜底为 1——Array.from({length: Infinity}) 会抛 RangeError
const mergedCount = computed(() =>
  Number.isFinite(props.count) && props.count >= 1 ? Math.floor(props.count) : 1,
)
const style = computed(() => ({
  '--yz-bb-gradient': gradient.value ?? 'none',
  '--yz-bb-duration': `${props.duration}s`,
  '--yz-bb-size': `${props.size}px`,
  '--yz-bb-line-width': `${props.lineWidth}px`,
  '--yz-bb-inset': `${-props.outset}px`,
  '--yz-bb-radius': `${props.radius}px`,
}))
const beams = computed(() =>
  Array.from({ length: mergedCount.value }, (_, i) => ({
    // 首条无延迟（-0s 也省略），其余 -duration*i/count 负延迟均匀错开
    delay: i === 0 ? '' : `-${(props.duration * i) / mergedCount.value}s`,
  })),
)
</script>

<template>
  <div class="yz-border-beam" :style="style">
    <div class="yz-border-beam__layer" aria-hidden="true">
      <span
        v-for="(b, i) in beams"
        :key="i"
        class="yz-border-beam__orb"
        :style="{ animationDelay: b.delay }"
      />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.yz-border-beam {
  position: relative;
  border-radius: var(--yz-bb-radius, 0px);
}

/* 光束层：绝对定位覆盖容器边缘，mask 只暴露边框环（padding 区域） */
.yz-border-beam__layer {
  display: none;
  position: absolute;
  inset: var(--yz-bb-inset, 0px);
  border-radius: inherit;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  padding: var(--yz-bb-line-width, 1px);
}

/* mask-composite: exclude：content-box 外露 = 边框环 */
@supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
  .yz-border-beam__layer {
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }
}

/* 光束光斑：渐变方块沿边框路径（rect + round size）循环行走 */
@supports (offset-path: rect(0 auto auto 0 round 1px)) {
  .yz-border-beam__layer { display: block; }
  .yz-border-beam__orb {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--yz-bb-size, 100px);
    aspect-ratio: 1 / 1;
    opacity: 0.95;
    background-image: var(--yz-bb-gradient, none);
    offset-anchor: 90% 50%;
    offset-distance: 0%;
    offset-path: rect(0 auto auto 0 round var(--yz-bb-size, 100px));
    offset-rotate: auto;
    animation: yz-border-beam-move var(--yz-bb-duration, 6s) linear infinite;
    will-change: offset-distance;
  }
}

@keyframes yz-border-beam-move {
  from { offset-distance: 0%; }
  to { offset-distance: 100%; }
}

/* 装饰性动效：prefers-reduced-motion 时隐藏（与 antd 一致） */
@media (prefers-reduced-motion: reduce) {
  .yz-border-beam__orb { display: none; }
}
</style>
