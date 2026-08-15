<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import SiteSidebar from './components/SiteSidebar.vue'
import ComponentSection from './components/ComponentSection.vue'
import BackToTop from './components/BackToTop.vue'
import { registryEntriesFor, componentMap } from './registry'
import { platforms as platformList } from './platforms'
import { t } from './i18n'

const activeKey = ref<string | null>(null)

// 平台（端）切换：localStorage 'yz-platform' 持久化；默认「第一个有组件的端」
function readInitialPlatform(): string {
  let stored: string | null = null
  try {
    stored = localStorage.getItem('yz-platform')
  } catch {
    /* 测试/隐私模式下降级 */
  }
  if (stored && platformList.some((p) => p.key === stored)) return stored
  for (const p of platformList) {
    if (registryEntriesFor(p.key).length > 0) return p.key
  }
  return platformList[0]?.key ?? 'desktop'
}

const activePlatform = ref(readInitialPlatform())
const visibleEntries = computed(() => registryEntriesFor(activePlatform.value))

function selectPlatform(key: string) {
  if (activePlatform.value === key) return
  activePlatform.value = key
  try {
    localStorage.setItem('yz-platform', key)
  } catch {
    /* ignore */
  }
  activeKey.value = null
}

// IntersectionObserver 高亮当前区块（切端后区块集合变化，重建 observer）
let observer: IntersectionObserver | null = null
function setupObserver() {
  observer?.disconnect()
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length > 0) {
        activeKey.value = visible[0].target.id.replace('section-', '')
      }
    },
    { rootMargin: '-20% 0px -70% 0px' },
  )
  for (const e of visibleEntries.value) {
    const el = document.getElementById(`section-${e.key}`)
    if (el) observer.observe(el)
  }
}
onMounted(setupObserver)
watch(visibleEntries, setupObserver)
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <main class="shell">
    <div class="shell__grid">
      <SiteSidebar
        :active-key="activeKey"
        :platforms="platformList"
        :active-platform="activePlatform"
        :entries="visibleEntries"
        @select-platform="selectPlatform"
      />
      <div class="shell__content">
        <template v-if="visibleEntries.length > 0">
          <ComponentSection
            v-for="e in visibleEntries"
            :key="e.key"
            :entry="e"
            :component="componentMap[e.key]"
            :index="e.order"
          />
        </template>
        <p v-else class="shell__empty">{{ t('app.emptyPlatform') }}</p>
      </div>
    </div>
    <BackToTop />
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
.shell__empty {
  padding: 64px 32px;
  text-align: center;
  font-size: 14px;
  color: var(--yz-ink-3);
}
</style>

<style>
/* PRD 6.1：锚点导航平滑滚动 + 落点避让（beautifului: scroll-mt-8 由区块承担，全局无需 scroll-padding） */
html {
  scroll-behavior: smooth;
}

/* 区块入场动画 yz-fade-up 已由组件库 animations.scss 全局提供（B2 评审 Minor：移除本地重复定义） */
</style>
