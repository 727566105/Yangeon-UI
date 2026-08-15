<script setup lang="ts">
// 思考光球加载指示器（Vue 移植版，原组件 thinking-orbs，MIT © Jakub Antalik 2026：
// https://github.com/Jakubantalik/thinking-orbs）
// 一个共享时钟（performance.now）让所有挂载的 orb 保持同相；每个实例独立 rAF 循环，
// 离屏（IntersectionObserver）或标签页隐藏（visibilitychange）时自动暂停；reduced-motion
// 用户得到跟随当前主题的静态代表帧。
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'
import { MODE_DRAWS } from './engine/registry'
import { resolvePreset } from './presets'
import { useReducedMotion, useResolvedDark } from './theme'
import type { ThinkingOrbsProps } from './types'

const LABELS: Record<string, string> = {
  working: 'Working…',
  searching: 'Searching…',
  solving: 'Solving…',
  listening: 'Listening…',
  connecting: 'Connecting…',
  weaving: 'Weaving…',
  composing: 'Composing…',
  breathing: 'Thinking…',
  shaping: 'Shaping…',
}

const props = withDefaults(defineProps<ThinkingOrbsProps>(), {
  state: 'working',
  size: 64,
  theme: 'auto',
  speed: 1,
  paused: false,
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
// aria-* 属性在 Vue 中一律透传（不进 props），经 attrs 读取；缺失时回退状态英文标签
const attrs = useAttrs()
const ariaLabel = computed(
  () => (attrs['aria-label'] as string | undefined) ?? LABELS[props.state],
)
const themeRef = computed(() => props.theme)
const dark = useResolvedDark(themeRef, canvasRef)
const reduced = useReducedMotion()

// 与 React useEffect 语义一致：挂载跑一次 + 依赖变化重跑 + 卸载清理。
// 注意不能 immediate（setup 阶段 canvasRef 尚未绑定），统一走 onMounted。
let dispose: (() => void) | null = null

function setupOrb() {
  dispose?.()
  dispose = null
  const canvas = canvasRef.value
  if (!canvas) return
    const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1)
    canvas.width = Math.round(props.size * dpr)
    canvas.height = Math.round(props.size * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { mode, speed: baseSpeed, opts } = resolvePreset(props.state, props.size)
    const draw = MODE_DRAWS[mode]
    const effSpeed = baseSpeed * props.speed

    const frame = (tSec: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, props.size, props.size)
      draw(ctx, props.size, tSec, dark.value, opts)
    }

    // reduced motion → one static, deterministic frame
    if (reduced.value) {
      frame(0.6)
      return
    }

    let raf = 0
    let running = false
    const loop = () => {
      frame((performance.now() / 1000) * effSpeed)
      if (running) raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || props.paused) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // draw at least one frame even when paused/offscreen
    frame((performance.now() / 1000) * effSpeed)

    // pause offscreen + on hidden tabs — free when not visible
    let visible = true
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting
            if (visible && document.visibilityState !== 'hidden') start()
            else stop()
          })
        : null
    io?.observe(canvas)
    const onVis = () => {
      if (document.visibilityState === 'hidden') stop()
      else if (visible) start()
    }
    document.addEventListener('visibilitychange', onVis)
    if (!io) start()

    // watch cleanup：props 变化或组件卸载时停止循环并解绑
    dispose = () => {
      stop()
      io?.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
}

onMounted(setupOrb)
onBeforeUnmount(() => dispose?.())
watch(
  [
    () => props.state,
    () => props.size,
    dark,
    () => props.speed,
    () => props.paused,
    reduced,
  ],
  setupOrb,
)
</script>

<template>
  <canvas
    ref="canvasRef"
    role="img"
    :aria-label="ariaLabel"
    :style="{ width: props.size + 'px', height: props.size + 'px', display: 'block', ...props.style }"
  />
</template>
