<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Component } from 'vue'
import VariantSwitcher from './VariantSwitcher.vue'
import VariantTabs from './VariantTabs.vue'
import { buildVariantSegments } from './buildVariantSegments'
import { YzIcon } from 'yzen-ui'
import { DemoStage } from '@yzen-ui/shared'
import type { RegistryEntry } from '../registry'
import { useI18n } from '../i18n'

const props = defineProps<{ entry: RegistryEntry; component: Component; index: number }>()
const { t, localized } = useI18n()

const activeVariant = ref(0)
const copied = ref(false)
const viewCodeOpen = ref(false)

// 变体切换显示名（label 来自 registry.json 双语字段，随语言响应式切换；
// label 为空时回退 id，避免切换按钮显示空白——与 Console 编辑页预览逻辑对齐；
// group 可选：二维切换（如样式 A/B 各含多个状态）时分段显示）
const displayVariants = computed(() =>
  props.entry.variants.map((v) => ({
    ...v,
    label: localized(v.label) || v.id,
    // group 双语文案均空时视为无分组（旧数据兼容）
    group: v.group && (v.group.zh || v.group.en) ? localized(v.group) : undefined,
  })),
)

// 多样式（多段）时显示样式 tab 栏（surface 卡片外上方）；单段时无 tab，按钮组直接渲染
const showTabs = computed(() => buildVariantSegments(displayVariants.value).length > 1)

// 入场动画 stagger（beautifului: fade-up 600ms，60ms 递增延迟）
const sectionStyle = computed(() => ({
  animation: `yz-fade-up 600ms var(--yz-ease-out-strong) ${(props.index - 1) * 60}ms both`,
}))

// demo 渲染由 @yzen-ui/shared 的 DemoStage 承担（glob + defineAsyncComponent 包装，
// 防 [object Promise] 缺陷；showcase 与 console 同一渲染路径）

// 组件源码（构建期 ?raw 注入，用于复制代码与查看代码）
// 展示完整组件实现文件（<Name>.vue），而非薄壳 demo.vue（对齐 beautifului 的 View code：
// 用户看到的是组件本体源码，demo.vue 只有一层 v-bind 转发没有参考价值）
const componentModules = import.meta.glob(
  '../../../../packages/yzen-ui/src/components/*/*.vue',
  { query: '?raw', import: 'default', eager: true },
)

const componentSource = computed(() => {
  const match = Object.entries(componentModules).find(
    ([p]) => p.includes(`/${props.entry.key}/`) && !p.endsWith('/demo.vue'),
  )
  const path = match?.[0] ?? ''
  return { filename: path.split('/').pop() ?? '', source: (match?.[1] as string) ?? '' }
})

async function copyCode() {
  if (!componentSource.value.source) return
  try {
    await navigator.clipboard.writeText(componentSource.value.source)
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
        <h3 class="component-section__name">{{ localized(entry.name) }}</h3>
        <span
          v-for="tag in entry.tags"
          :key="tag.zh"
          class="component-section__tag"
        >{{ localized(tag) }}</span>
      </div>
      <p class="component-section__desc" :title="localized(entry.description)">{{ localized(entry.description) }}</p>
    </div>

    <!-- 样式 tab 栏：在 surface 卡片外（上方），先选样式再在卡片内选状态 -->
    <VariantTabs
      v-if="showTabs"
      v-model="activeVariant"
      :variants="displayVariants"
      class="component-section__tabs"
    />

    <div class="component-section__surface">
      <div class="component-section__demo">
        <DemoStage
          :entry-key="entry.key"
          :variant-index="activeVariant"
          :variants="entry.variants"
        />
      </div>

      <VariantSwitcher
        v-model="activeVariant"
        :variants="displayVariants"
        class="component-section__switcher"
      />

      <!-- 右上动作：复制 + 查看代码（beautifului: opacity-0 group-hover:opacity-100） -->
      <div class="component-section__actions">
        <button
          class="component-section__action"
          type="button"
          :aria-label="copied ? t('section.copied') : t('section.copyCode')"
          :title="copied ? t('section.copied') : t('section.copyCode')"
          @click="copyCode"
        >
          <YzIcon :name="copied ? 'check' : 'copy'" :size="14" />
        </button>
        <button
          class="component-section__action"
          type="button"
          :aria-label="t('section.viewCode')"
          :title="t('section.viewCode')"
          @click="viewCodeOpen = true"
        >
          <YzIcon name="code" :size="14" />
        </button>
      </div>
    </div>

    <!-- 查看代码弹窗（对齐 beautifului.dev View code 实测样式：黑30%+blur2px 遮罩 / 768px·85vh 面板 / 实心复制钮 / 方形关闭钮） -->
    <Teleport to="body">
      <div
        v-if="viewCodeOpen"
        class="code-viewer"
        role="dialog"
        aria-modal="true"
        :aria-label="t('section.viewCode')"
      >
        <div class="code-viewer__backdrop" aria-hidden="true" @click="viewCodeOpen = false" />
        <div class="code-viewer__panel">
          <div class="code-viewer__bar">
            <div class="code-viewer__file">
              <h3 class="code-viewer__title">{{ localized(entry.name) }}</h3>
              <p class="code-viewer__path">components/{{ entry.key }}/{{ componentSource.filename }}</p>
            </div>
            <div class="code-viewer__controls">
              <button
                class="code-viewer__copy-btn"
                type="button"
                :aria-label="copied ? t('section.copied') : t('section.copyCode')"
                @click="copyCode"
              >
                <YzIcon :name="copied ? 'check' : 'copy'" :size="14" />
                {{ copied ? t('section.copied') : t('section.copy') }}
              </button>
              <button
                class="code-viewer__icon-btn"
                type="button"
                :aria-label="t('section.close')"
                @click="viewCodeOpen = false"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <pre class="code-viewer__pre"><code>{{ componentSource.source }}</code></pre>
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

/* 区块头：等宽 11px 编号 + 13px semibold 标题 + 12.5px 说明（beautifului 原样）。
   空间不足时描述先收缩省略（flex:1 1 0 + min-width:0 触发 ellipsis），
   标题/标签不参与挤压（flex-shrink:0），overflow:hidden 兜底极端超长 */
.component-section__head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
  overflow: hidden;
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
  flex-shrink: 0;
  overflow: hidden;
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
  flex: 1 1 0;
  min-width: 0;
  margin: 0;
  font-size: 12.5px;
  color: var(--yz-ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 样式 tab 栏：surface 卡片外上方，居中与卡片内切换器对齐 */
.component-section__tabs {
  display: flex;
  justify-content: center;
  margin: 0 0 10px;
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

/* 变体切换：预览底部居中。left:0 right:0 让容器宽度 = surface 全宽，
   内部由 .variant-switcher 自行 flex-wrap 居中——若用 left:50%+translateX(-50%)，
   绝对定位可用宽度会被砍半，分组并排时放不下被迫换行 */
.component-section__switcher {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  display: flex;
  justify-content: center;
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
/* 查看代码弹窗（非 scoped：Teleport 到 body）——样式对齐 beautifului.dev View code 实测值：
   overlay p-4/sm:p-8 + 独立背板 bg-black/30 backdrop-blur(2px)；
   面板 max-w-3xl(768px) max-h-[85vh] rounded-window(14px) shadow-overlay pop-in 250ms； */
.code-viewer {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
@media (min-width: 640px) {
  .code-viewer { padding: 32px; }
}
.code-viewer__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.code-viewer__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 768px;
  max-height: 85vh;
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-overlay);
  overflow: hidden;
  animation: yz-pop-in 250ms var(--yz-ease-out-strong) both;
}
/* 顶栏（primitive-card-bar：flex items-center justify-between gap-3 border-b border-line） */
.code-viewer__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--yz-line);
}
.code-viewer__file {
  min-width: 0;
}
.code-viewer__title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--yz-ink);
}
.code-viewer__path {
  margin: 0;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  line-height: 1.5;
  letter-spacing: -0.14px;
  color: var(--yz-ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.code-viewer__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
/* 复制按钮（beautifului: h-7 bg-ink text-canvas rounded-control px-2.5 + 内高光 + active 按压） */
.code-viewer__copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: var(--yz-ink);
  color: var(--yz-canvas);
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 1px 2px rgba(16, 24, 40, 0.1);
  transition: transform 150ms var(--yz-ease-out-strong);
}
.code-viewer__copy-btn:active { transform: scale(0.98); }
/* 关闭按钮（beautifului: primitive-icon-button size-7，hover bg-hover text-ink） */
.code-viewer__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.code-viewer__icon-btn:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
/* 代码区（beautifului: flex-1 bg-inset p-4 text-[12px] text-ink-2）
   字体对齐 GitHub 代码页实测：ui-monospace → SF Mono → Menlo → Consolas 系统等宽栈，
   而非页面品牌字体 JetBrains Mono（代码展示语境用"现场代码字体"） */
.code-viewer__pre {
  flex: 1;
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: var(--yz-inset);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 12px;
  line-height: 20px;
  color: var(--yz-ink-2);
  white-space: pre;
}
</style>
