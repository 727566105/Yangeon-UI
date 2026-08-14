<script setup lang="ts">
// YzRecommendationCard — Recommendation Card 推荐卡片（移植自 beautifului.dev Recommendation Card）
// Agent 建议 + 置信度计量条 + 可折叠备选方案列表 + 接受按钮
import { computed, ref, watch } from 'vue'

export interface SuggestionSegment {
  /** 普通文本段 */
  text?: string
  /** 等宽代码高亮段（bg-accent-tint 徽标） */
  code?: string
}

export interface RecommendationOption {
  /** 信号强度：亮起的计量条数（0-3，beautifului: var(--orange) 填充） */
  level: number
  /** 备选方案名 */
  name: string
  /** 状态描述，如 "Needs review" / "No signal" */
  status: string
}

interface RecommendationCardProps {
  title?: string
  /** 建议正文（段落：普通文本 + code 段交错），入场 fade-in 180ms */
  segments?: SuggestionSegment[]
  /** 置信度计量条数（0-3，beautifului: var(--green) 填充） */
  confidenceLevel?: number
  /** 置信度标签，如 "High confidence" */
  confidenceLabel?: string
  /** 备选方案列表（折叠面板内） */
  alternatives?: RecommendationOption[]
  /** 备选方案折叠展开（受控/非受控双模式） */
  expanded?: boolean
}

const props = withDefaults(defineProps<RecommendationCardProps>(), {
  title: 'Want me to place this restock order?',
  segments: () => [
    { text: 'Reorder waffle cones from ' },
    { code: 'cone_king' },
    { text: ' with lead time ' },
    { code: '7_days' },
    { text: '.' },
  ],
  confidenceLevel: 3,
  confidenceLabel: 'High confidence',
  alternatives: () => [
    { level: 2, name: 'Switch to vanilla_madagascar', status: 'Needs review' },
    { level: 0, name: 'Full restock across every SKU', status: 'No signal' },
  ],
  expanded: false,
})

const emit = defineEmits<{
  (e: 'toggle', value: boolean): void
  (e: 'update:expanded', value: boolean): void
  (e: 'accept'): void
  (e: 'option', payload: { index: number; option: RecommendationOption }): void
}>()

// 受控/非受控双模式（同 YzToolChips）
const open = ref(props.expanded)
watch(
  () => props.expanded,
  (v) => (open.value = v),
)

function toggle() {
  open.value = !open.value
  emit('toggle', open.value)
  emit('update:expanded', open.value)
}

function accept() {
  emit('accept')
}

function pickOption(i: number) {
  const option = props.alternatives[i]
  if (!option) return
  emit('option', { index: i, option })
}

/** 置信度计量条（0-3） */
const confidenceBars = computed(() => Array.from({ length: 3 }, (_, i) => i < props.confidenceLevel))
/** 备选方案计量条（每行 3 根） */
function optionBars(level: number) {
  return Array.from({ length: 3 }, (_, i) => i < level)
}
</script>

<template>
  <div class="yz-recommendation-card">
    <div class="yz-recommendation-card__pad">
      <span class="yz-recommendation-card__title">{{ title }}</span>
      <p class="yz-recommendation-card__suggestion">
        <template v-for="(seg, i) in segments" :key="i">
          <code v-if="seg.code" class="yz-recommendation-card__code">{{ seg.code }}</code>
          <template v-else>{{ seg.text }}</template>
        </template>
      </p>
    </div>

    <!-- 备选方案折叠面板（beautifului: grid-rows 0fr/1fr + opacity，300ms ease-link） -->
    <div
      id="yz-recommendation-card__alternatives"
      class="yz-recommendation-card__collapse"
      :class="{ 'yz-recommendation-card__collapse--open': open }"
    >
      <div class="yz-recommendation-card__collapse-viewport">
        <div class="yz-recommendation-card__options">
          <p class="yz-recommendation-card__options-label">Other options</p>
          <button
            v-for="(opt, i) in alternatives"
            :key="i"
            type="button"
            class="yz-recommendation-card__option"
            @click="pickOption(i)"
          >
            <span class="yz-recommendation-card__meter" aria-hidden="true">
              <span
                v-for="(on, b) in optionBars(opt.level)"
                :key="b"
                class="yz-recommendation-card__bar"
                :class="{ 'yz-recommendation-card__bar--on': on }"
              />
            </span>
            <span class="yz-recommendation-card__option-name">{{ opt.name }}</span>
            <span class="yz-recommendation-card__option-status">{{ opt.status }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部栏（beautifului: primitive-card-footer 10px 12px，border-t bg-inset） -->
    <div class="yz-recommendation-card__footer">
      <span class="yz-recommendation-card__confidence">
        <span class="yz-recommendation-card__meter" aria-hidden="true">
          <span
            v-for="(on, b) in confidenceBars"
            :key="b"
            class="yz-recommendation-card__bar yz-recommendation-card__bar--confidence"
            :class="{ 'yz-recommendation-card__bar--on': on }"
          />
        </span>
        <span class="yz-recommendation-card__confidence-label">{{ confidenceLabel }}</span>
      </span>

      <span class="yz-recommendation-card__actions">
        <button
          type="button"
          class="yz-recommendation-card__btn yz-recommendation-card__btn--ghost"
          :aria-expanded="open"
          aria-controls="yz-recommendation-card__alternatives"
          @click="toggle"
        >
          Alternatives
        </button>
        <button
          type="button"
          class="yz-recommendation-card__btn yz-recommendation-card__btn--accent"
          @click="accept"
        >
          Accept
        </button>
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 根卡片（beautifului: w-full max-w-95 overflow-hidden rounded-card bg-surface shadow-card） */
.yz-recommendation-card {
  width: 100%;
  max-width: 380px;
  overflow: hidden;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
}

/* 标题区（beautifului: primitive-card-pad → padding 12px） */
.yz-recommendation-card__pad {
  padding: 12px;
}
.yz-recommendation-card__title {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--yz-ink);
}

/* 建议正文（beautifului: mt-1.5 min-h-12 13px leading-relaxed，fade-in 180ms） */
.yz-recommendation-card__suggestion {
  margin: 6px 0 0;
  min-height: 48px;
  font-size: 13px;
  line-height: 1.625;
  color: var(--yz-ink-2);
  animation: yz-fade-in 180ms ease-out both;
}

/* code 徽标（beautifului: rounded-md bg-accent-tint px-1.5 py-0.5 font-mono text-[12px] text-accent-ink） */
.yz-recommendation-card__code {
  border-radius: 6px;
  background: var(--yz-accent-tint);
  padding: 2px 6px;
  font-family: var(--yz-font-mono);
  font-size: 12px;
  color: var(--yz-accent-ink);
}

/* 折叠面板：grid-rows 0fr/1fr + opacity（beautifului: duration-300 ease-link 常驻过渡，双向平滑） */
.yz-recommendation-card__collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 300ms var(--yz-ease-link), opacity 300ms var(--yz-ease-link);
}
.yz-recommendation-card__collapse--open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.yz-recommendation-card__collapse-viewport {
  overflow: hidden;
}

/* 备选方案区（beautifului: border-t border-line bg-inset px-2 py-2） */
.yz-recommendation-card__options {
  border-top: 1px solid var(--yz-line);
  background: var(--yz-inset);
  padding: 8px;
}
.yz-recommendation-card__options-label {
  margin: 0;
  padding: 0 6px 4px;
  font-size: 11px;
  font-weight: 500;
  color: var(--yz-ink-3);
}

/* 备选方案行（beautifului: w-full rounded-control px-1.5 py-1.5 hover:bg-hover） */
.yz-recommendation-card__option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-recommendation-card__option:hover {
  background: var(--yz-hover);
}

/* 计量条（beautifului: w-1 h-[10px] rounded-full gap-0.5，transition-colors 300ms） */
.yz-recommendation-card__meter {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}
.yz-recommendation-card__bar {
  width: 4px;
  height: 10px;
  border-radius: 99px;
  background: var(--yz-line-strong);
  transition: background-color 300ms var(--yz-ease-out-strong);
}
.yz-recommendation-card__bar--on {
  background: var(--yz-orange);
}
.yz-recommendation-card__bar--confidence.yz-recommendation-card__bar--on {
  background: var(--yz-green);
}

.yz-recommendation-card__option-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  color: var(--yz-ink);
}
.yz-recommendation-card__option-status {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--yz-ink-3);
}

/* 底部栏（beautifului: primitive-card-footer → padding 10px 12px，flex justify-between gap-3 border-t bg-inset） */
.yz-recommendation-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-top: 1px solid var(--yz-line);
  background: var(--yz-inset);
}
.yz-recommendation-card__confidence {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.yz-recommendation-card__confidence-label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--yz-ink-2);
  white-space: nowrap;
}

/* 操作按钮（beautifului: h-7 rounded-control 12.5px font-medium，active:scale-[0.96]） */
.yz-recommendation-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: -2px;
  flex-shrink: 0;
}
.yz-recommendation-card__btn {
  height: 28px;
  border: none;
  border-radius: var(--yz-radius-control);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), transform 100ms var(--yz-ease-out-strong);
}
.yz-recommendation-card__btn:active {
  transform: scale(0.96);
}
/* Alternatives（beautifului: px-2.5 shadow-btn bg-surface text-ink hover:bg-hover） */
.yz-recommendation-card__btn--ghost {
  padding: 0 10px;
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
}
.yz-recommendation-card__btn--ghost:hover {
  background: var(--yz-hover);
}
/* Accept（beautifului: px-3 bg-accent text-white，内高光+描边 shadow，duration-150） */
.yz-recommendation-card__btn--accent {
  padding: 0 12px;
  background: var(--yz-accent);
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 0 0 1px rgba(16, 24, 40, 0.12),
    0 1px 2px rgba(16, 24, 40, 0.1);
  transition: background-color 150ms var(--yz-ease-out-strong), transform 150ms var(--yz-ease-out-strong);
}

/* 动效开关：关闭时停掉折叠过渡与入场动画 */
@media (prefers-reduced-motion: reduce) {
  .yz-recommendation-card__collapse,
  .yz-recommendation-card__option,
  .yz-recommendation-card__bar,
  .yz-recommendation-card__btn {
    transition: none;
  }
  .yz-recommendation-card__suggestion {
    animation: none;
  }
}
</style>
