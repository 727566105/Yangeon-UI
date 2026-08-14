<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import SiteNav from './components/SiteNav.vue'
import ComponentSection from './components/ComponentSection.vue'
import { registryEntries, componentMap, CATEGORY_LABELS } from './registry'
import { useGroups } from './groups'

const categories = useGroups()
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
  <SiteHeader />
  <div class="layout">
    <SiteNav :active-key="activeKey" @click.prevent="() => {}" />
    <main class="content">
      <div v-for="(entries, category) in categories" :key="category" class="category">
        <h2 class="category__title">{{ CATEGORY_LABELS[category] }}</h2>
        <ComponentSection
          v-for="e in entries"
          :key="e.key"
          :entry="e"
          :component="componentMap[e.key]"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  gap: 32px;
  max-width: 72rem;
  margin-inline: auto;
  padding: 32px 24px 80px;
}
.content {
  flex: 1;
  min-width: 0;
}
.category__title {
  margin: 0 0 24px;
  font-size: 20px;
  font-weight: 600;
  color: var(--yz-ink);
}
</style>
