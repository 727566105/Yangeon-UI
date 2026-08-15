<script setup lang="ts">
// YzShimmer — 渐变扫光文字（beautifului.dev shimmer 移植为 Vue 3 + Yzen 规范）
// 静态文本 + bg-clip-text 渐变 + background-position 循环扫光（yz-shimmer-text 1.4s），
// 用于 AI 响应生成中的占位提示（"Generating response…"）。
import { computed } from 'vue'

interface ShimmerProps {
  /** 扫光文字 */
  text?: string
  /** 字号：sm（13px）/ md（默认 14px），对应 text-sm / text-base */
  size?: 'sm' | 'md'
  /** 扫光周期（秒） */
  duration?: number
}

const props = withDefaults(defineProps<ShimmerProps>(), {
  text: 'Generating response…',
  size: 'md',
  duration: 1.4,
})

const classes = computed(() => ['yz-shimmer', `yz-shimmer--${props.size}`])
</script>

<template>
  <p :class="classes" :style="{ animationDuration: `${duration}s` }">{{ text }}</p>
</template>

<style scoped>
/* 渐变扫光文字（与 ai-loading 的 shimmer 同款，颜色取 muted-foreground 语义） */
.yz-shimmer {
  margin: 0;
  display: inline-block;
  font-weight: 500;
  white-space: nowrap;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  background-image: linear-gradient(
    90deg,
    var(--yz-ink-3) 35%,
    var(--yz-ink) 50%,
    var(--yz-ink-3) 65%
  );
  background-size: 200% 100%;
  animation: yz-shimmer-text 1.4s linear infinite;
}
.yz-shimmer--sm { font-size: 13px; }
.yz-shimmer--md { font-size: 14px; }
</style>
