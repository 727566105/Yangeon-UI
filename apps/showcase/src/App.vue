<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SiteSidebar from './components/SiteSidebar.vue'
import ComponentSection from './components/ComponentSection.vue'
import { registryEntries, componentMap } from './registry'

const activeKey = ref<string | null>(null)

// IntersectionObserver 高亮当前区块
let observer: IntersectionObserver | null = null
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length > 0) {
        activeKey.value = visible[0].target.id.replace('section-', '')
      }
    },
    { rootMargin: '-20% 0px -70% 0px' },
  )
  for (const e of registryEntries) {
    const el = document.getElementById(`section-${e.key}`)
    if (el) observer.observe(el)
  }
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <main class="shell">
    <div class="shell__grid">
      <SiteSidebar :active-key="activeKey" />
      <div class="shell__content">
        <ComponentSection
          v-for="e in registryEntries"
          :key="e.key"
          :entry="e"
          :component="componentMap[e.key]"
          :index="e.order"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 布局对齐 beautifului.dev：960px 居中容器 + 发丝边框；桌面端 288px 侧栏网格 */
.shell {
  margin-inline: auto;
  max-width: 960px;
  background: var(--yz-page);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.shell__grid {
  display: block;
}
@media (min-width: 1024px) {
  .shell__grid {
    display: grid;
    grid-template-columns: 288px minmax(0, 1fr);
  }
}
</style>

<style>
/* PRD 6.1：锚点导航平滑滚动 + 落点避让（beautifului: scroll-mt-8 由区块承担，全局无需 scroll-padding） */
html {
  scroll-behavior: smooth;
}

/* 区块入场动画（beautifului: fade-up 600ms ease-out-strong，stagger 由行内 animation-delay 控制） */
@keyframes yz-fade-up {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
