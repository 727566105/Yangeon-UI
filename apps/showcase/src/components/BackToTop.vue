<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { t } from '../i18n'

// 返回顶部悬浮按钮：滚动超过阈值后淡入（右下角，beautifului 视觉：surface 底 + 发丝边框 + raised 阴影）
const visible = ref(false)
const THRESHOLD = 400

let ticking = false
function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    visible.value = window.scrollY > THRESHOLD
    ticking = false
  })
}

function scrollTop() {
  // prefers-reduced-motion 时禁用平滑滚动（PRD 4.2 动效降级）
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <button
    type="button"
    class="back-to-top"
    :class="{ 'back-to-top--visible': visible }"
    :aria-label="t('common.backToTop')"
    @click="scrollTop"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  </button>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 40;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--yz-line);
  border-radius: var(--yz-radius-pill);
  background: var(--yz-surface);
  color: var(--yz-ink);
  cursor: pointer;
  box-shadow: var(--yz-shadow-raised);
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition:
    opacity 180ms var(--yz-ease-out-strong),
    transform 180ms var(--yz-ease-out-strong),
    background-color 120ms ease;
}

.back-to-top--visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.back-to-top:hover {
  background: var(--yz-hover);
}

.back-to-top:focus-visible {
  outline: 2px solid var(--yz-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .back-to-top {
    transition: none;
  }
}
</style>
