<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import VariantSwitcher from './VariantSwitcher.vue'
import { YzIcon } from 'yzen-ui'
import type { RegistryEntry } from '../registry'

const props = defineProps<{ entry: RegistryEntry; component: Component; index: number }>()

const activeVariant = ref(0)
const copied = ref(false)
const viewCodeOpen = ref(false)

// 入场动画 stagger（beautifului: fade-up 600ms，60ms 递增延迟）
const sectionStyle = computed(() => ({
  animation: `yz-fade-up 600ms var(--yz-ease-out-strong) ${(props.index - 1) * 60}ms both`,
}))

// demo 组件（异步加载，构建期注册；文件位于 apps/showcase/src/components/，到仓库根 4 级）
const demos = import.meta.glob(
  '../../../../packages/yzen-ui/src/components/*/demo.vue',
  { import: 'default' },
)
const currentDemo = computed(
  () => demos[`../../../../packages/yzen-ui/src/components/${props.entry.key}/demo.vue`],
)

// demo 源码（构建期 ?raw 注入，用于复制代码与查看代码）
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
  <section
    :id="`section-${entry.key}`"
    class="component-section group"
    :style="sectionStyle"
  >
    <div class="component-section__head">
      <span class="component-section__num">{{ String(entry.order).padStart(2, '0') }}</span>
      <div class="component-section__title-wrap">
        <h3 class="component-section__name">{{ entry.name }}</h3>
        <span
          v-for="tag in entry.tags"
          :key="tag"
          class="component-section__tag"
        >{{ tag }}</span>
      </div>
      <p class="component-section__desc">{{ entry.description }}</p>
    </div>

    <div class="component-section__surface">
      <div class="component-section__demo">
        <component
          :is="currentDemo"
          :variant-index="activeVariant"
          :variants="entry.variants"
        />
      </div>

      <VariantSwitcher
        v-model="activeVariant"
        :variants="entry.variants"
        class="component-section__switcher"
      />

      <!-- 右上动作：复制 + 查看代码（beautifului: opacity-0 group-hover:opacity-100） -->
      <div class="component-section__actions">
        <button
          class="component-section__action"
          type="button"
          :aria-label="copied ? '已复制' : '复制代码'"
          :title="copied ? '已复制' : '复制代码'"
          @click="copyCode"
        >
          <YzIcon :name="copied ? 'check' : 'copy'" :size="14" />
        </button>
        <button
          class="component-section__action"
          type="button"
          aria-label="查看代码"
          title="查看代码"
          @click="viewCodeOpen = true"
        >
          <YzIcon name="chevron-right" :size="14" />
        </button>
      </div>
    </div>

    <!-- 查看代码弹窗（beautifului: View code 面板） -->
    <Teleport to="body">
      <div
        v-if="viewCodeOpen"
        class="code-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="查看代码"
        @click.self="viewCodeOpen = false"
      >
        <div class="code-viewer__panel">
          <div class="code-viewer__bar">
            <span class="code-viewer__file">
              <span class="code-viewer__filename">{{ entry.key }}/demo.vue</span>
              <span class="code-viewer__lang">Vue SFC</span>
            </span>
            <span class="code-viewer__controls">
              <button
                class="code-viewer__btn"
                type="button"
                :aria-label="copied ? '已复制' : '复制代码'"
                @click="copyCode"
              >
                <YzIcon :name="copied ? 'check' : 'copy'" :size="13" />
                {{ copied ? '已复制' : '复制' }}
              </button>
              <button
                class="code-viewer__btn"
                type="button"
                aria-label="关闭"
                @click="viewCodeOpen = false"
              >
                <YzIcon name="close" :size="13" />
                关闭
              </button>
            </span>
          </div>
          <pre class="code-viewer__pre"><code>{{ demoSource }}</code></pre>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
/* 区块：对齐 beautifului —— border-b dashed 分隔、px-8 py-10、scroll-mt-8、user-select none */
.component-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  scroll-margin-top: 32px;
  border-bottom: 1px dashed var(--yz-line);
  padding: 40px 32px;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}
.component-section :is(input, textarea, [contenteditable='true'], pre, code) {
  -webkit-user-select: text;
  user-select: text;
  -webkit-touch-callout: default;
}

/* 区块头：等宽 11px 编号 + 13px semibold 标题 + 12.5px 说明（beautifului 原样） */
.component-section__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}
.component-section__num {
  margin-top: 2px;
  font-family: var(--yz-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}
.component-section__title-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.component-section__name {
  margin: 0;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--yz-ink);
}
.component-section__tag {
  font-size: 11px;
  color: var(--yz-tag-blue);
  white-space: nowrap;
}
.component-section__desc {
  margin: 0 0 0 auto;
  font-size: 12.5px;
  color: var(--yz-ink-3);
  text-wrap: pretty;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 预览表面：对齐 beautifului —— rounded-window(14px) bg-canvas p-3 shadow-hairline min-height 272px */
.component-section__surface {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  min-height: 272px;
  border-radius: var(--yz-radius-window);
  background: var(--yz-canvas);
  box-shadow: 0 0 0 1px var(--yz-line);
  padding: 12px;
}
.component-section__demo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 240px;
  padding-top: 20px;
  padding-bottom: 36px;
}

/* 变体切换：预览底部居中胶囊（beautifului: absolute bottom-2.5 rounded-full bg-field p-0.5） */
.component-section__switcher {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

/* 右上动作组（beautifului: absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100） */
.component-section__actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 150ms var(--yz-ease-out-strong);
}
.component-section:hover .component-section__actions,
.component-section:focus-within .component-section__actions {
  opacity: 1;
}
.component-section__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: var(--yz-surface);
  color: var(--yz-ink-3);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.component-section__action:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
</style>

<style>
/* 查看代码弹窗（非 scoped：Teleport 到 body） */
.code-viewer {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  animation: yz-fade-in 180ms ease-out both;
}
.code-viewer__panel {
  display: flex;
  flex-direction: column;
  width: min(720px, calc(100vw - 48px));
  max-height: min(560px, calc(100vh - 96px));
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-overlay);
  overflow: hidden;
}
.code-viewer__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--yz-line);
}
.code-viewer__file {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.code-viewer__filename {
  font-family: var(--yz-font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink);
}
.code-viewer__lang {
  font-size: 11.5px;
  color: var(--yz-ink-3);
}
.code-viewer__controls {
  display: flex;
  gap: 4px;
}
.code-viewer__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.code-viewer__btn:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
.code-viewer__pre {
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: var(--yz-inset);
  font-family: var(--yz-font-mono);
  font-size: 12px;
  line-height: 1.7;
  color: var(--yz-ink-2);
  white-space: pre;
}
</style>
