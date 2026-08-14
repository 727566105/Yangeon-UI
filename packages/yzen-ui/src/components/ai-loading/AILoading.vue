<script setup lang="ts">
// YzAILoading — AI 智能加载（移植自 beautifului.dev Loading State）
// 像素波浪点阵 + 渐变扫光文字 + 计时器；支持 drive/dots/orbit 三形态
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

// 计时器（elapsed 秒）
const elapsed = ref(0)
let interval: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (!props.timer) return
  interval = setInterval(() => {
    elapsed.value = Number((elapsed.value + 0.1).toFixed(1))
  }, 100)
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const elapsedText = computed(() => `${elapsed.value.toFixed(1)}s`)

// 3x3 像素点阵的波浪延迟（beautifului 原值）
const pixelDelays = [
  [90, 180, 270],
  [0, 90, 180],
  [90, 180, 270],
]
</script>

<template>
  <div class="yz-ai-loading" :class="`yz-ai-loading--${variant}`" role="status" aria-live="polite">
    <!-- Drive：像素波浪点阵 + 扫光文字 + 计时 -->
    <template v-if="variant === 'drive'">
      <span class="yz-ai-loading__pixels" aria-hidden="true">
        <span
          v-for="(row, ri) in pixelDelays"
          :key="ri"
          class="yz-ai-loading__pixel-row"
        >
          <span
            v-for="(delay, ci) in row"
            :key="ci"
            class="yz-ai-loading__pixel"
            :style="{ animationDelay: `${delay}ms` }"
          />
        </span>
      </span>
      <span class="yz-ai-loading__shimmer">{{ label }}</span>
      <span class="yz-ai-loading__timer">{{ elapsedText }}</span>
    </template>

    <!-- Dots：三点跳动 + 计时 -->
    <template v-else-if="variant === 'dots'">
      <span class="yz-ai-loading__dots" aria-hidden="true">
        <span v-for="i in 3" :key="i" class="yz-ai-loading__dot" :style="{ animationDelay: `${i * 150}ms` }" />
      </span>
      <span class="yz-ai-loading__timer">{{ elapsedText }}</span>
    </template>

    <!-- Orbit：环形旋转 + 扫光文字 -->
    <template v-else>
      <span class="yz-ai-loading__orbit" aria-hidden="true">
        <span class="yz-ai-loading__orbit-dot" />
      </span>
      <span class="yz-ai-loading__shimmer">{{ label }}</span>
    </template>
  </div>
</template>

<style scoped>
/* 结构对齐 beautifului：行内 flex + gap，全部 token 化 */
.yz-ai-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
}

/* --- Drive：3x3 像素网格 --- */
.yz-ai-loading__pixels {
  display: grid;
  grid-template-columns: repeat(3, 4px);
  gap: 1.5px;
}
.yz-ai-loading__pixel-row {
  display: contents;
}
.yz-ai-loading__pixel {
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: var(--yz-ink);
  opacity: 0.15;
  animation: yz-pixel-on 650ms ease-in-out infinite;
}

/* --- 渐变扫光文字（beautifului: bg-clip-text + shimmer-text） --- */
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

/* --- 计时器 --- */
.yz-ai-loading__timer {
  font-family: var(--yz-font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* --- Dots：三点跳动 --- */
.yz-ai-loading__dots {
  display: flex;
  gap: 3px;
}
.yz-ai-loading__dot {
  width: 5px;
  height: 5px;
  border-radius: 99px;
  background: var(--yz-ink);
  animation: yz-eq-bounce 1s ease-in-out infinite;
  transform-origin: center;
}

/* --- Orbit：环形旋转点 --- */
.yz-ai-loading__orbit {
  position: relative;
  width: 16px;
  height: 16px;
  border: 2px solid var(--yz-line-strong);
  border-top-color: var(--yz-ink);
  border-radius: 99px;
  animation: yz-spin 0.8s linear infinite;
}
.yz-ai-loading__orbit-dot {
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 99px;
  background: var(--yz-accent);
}

/* 全局动效开关：关闭时停掉装饰性动画（计时器保留） */
@media (prefers-reduced-motion: reduce) {
  .yz-ai-loading__pixel,
  .yz-ai-loading__shimmer,
  .yz-ai-loading__dot,
  .yz-ai-loading__orbit {
    animation: none;
  }
}
</style>
