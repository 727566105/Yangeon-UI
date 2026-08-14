<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import VariantSwitcher from './VariantSwitcher.vue'
import { YzIcon } from 'yzen-ui'
import type { RegistryEntry } from '../registry'

const props = defineProps<{ entry: RegistryEntry; component: Component }>()

const activeVariant = ref(0)
const copied = ref(false)

// demo 组件（异步加载，构建期注册；文件位于 apps/showcase/src/components/，到仓库根 4 级）
const demos = import.meta.glob(
  '../../../../packages/yzen-ui/src/components/*/demo.vue',
  { import: 'default' },
)
const currentDemo = computed(
  () => demos[`../../../../packages/yzen-ui/src/components/${props.entry.key}/demo.vue`],
)

// demo 源码（构建期 ?raw 注入，用于复制代码）
const demoModules = import.meta.glob(
  '../../../../packages/yzen-ui/src/components/*/demo.vue',
  { query: '?raw', import: 'default', eager: true },
)

const demoSource = computed(() => {
  const key = Object.keys(demoModules).find((p) => p.includes(`/${props.entry.key}/demo.vue`))
  return key ? (demoModules[key] as string) : ''
})

async function copyCode() {
  if (!demoSource.value) return
  try {
    await navigator.clipboard.writeText(demoSource.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* clipboard 不可用时静默 */
  }
}
</script>

<template>
  <section :id="`section-${entry.key}`" class="component-section">
    <div class="component-section__head">
      <span class="component-section__num">{{ String(entry.order).padStart(2, '0') }}</span>
      <h3 class="component-section__name">{{ entry.name }}</h3>
      <span
        v-for="tag in entry.tags"
        :key="tag"
        class="component-section__tag"
      >{{ tag }}</span>
    </div>
    <p class="component-section__desc">{{ entry.description }}</p>

    <div class="component-section__canvas">
      <VariantSwitcher
        v-model="activeVariant"
        :variants="entry.variants"
        class="component-section__switcher"
      />
      <div class="component-section__demo">
        <component
          :is="currentDemo"
          :variant-index="activeVariant"
          :variants="entry.variants"
        />
      </div>
    </div>

    <div class="component-section__actions">
      <button class="copy-btn" type="button" @click="copyCode">
        <YzIcon :name="copied ? 'check' : 'copy'" :size="14" />
        {{ copied ? '已复制' : '复制代码' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.component-section {
  scroll-margin-top: 80px;
  margin-bottom: 48px;
}
.component-section__head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.component-section__num {
  font-family: var(--yz-font-mono);
  font-size: 12px;
  color: var(--yz-ink-3);
}
.component-section__name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--yz-ink);
}
.component-section__tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--yz-tag-blue);
  background: var(--yz-accent-tint);
}
.component-section__desc {
  margin: 6px 0 16px;
  font-size: 13px;
  color: var(--yz-ink-2);
}
.component-section__canvas {
  border: 1px solid var(--yz-line);
  border-radius: 10px;
  background: var(--yz-canvas);
  padding: 24px;
  position: relative;
}
.component-section__switcher {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1;
}
.component-section__demo {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  padding-top: 40px;
}
.component-section__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--yz-line-strong);
  border-radius: 8px;
  background: var(--yz-surface);
  color: var(--yz-ink-2);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.copy-btn:hover { color: var(--yz-ink); background: var(--yz-hover); }
</style>
