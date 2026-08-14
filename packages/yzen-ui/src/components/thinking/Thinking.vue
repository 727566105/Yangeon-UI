<script setup lang="ts">
// YzThinking — Thinking 思考折叠（移植自 beautifului.dev Thinking State）
// 渐变扫光标题 + 星标 + 折叠推理步骤（时间戳/类型点/检索与编码子任务）
import { computed, ref, watch } from 'vue'
import { YzIcon } from '../../index'

export interface ThinkingStep {
  type: 'thinking' | 'search' | 'coding' | 'success'
  time?: string
  title: string
  detail?: string
}

interface ThinkingProps {
  expanded?: boolean
  label?: string
  steps?: ThinkingStep[]
}

const props = withDefaults(defineProps<ThinkingProps>(), {
  expanded: false,
  label: 'Thinking',
  steps: () => [
    { type: 'thinking', time: '00:00', title: '解析请求：预测今晚极光强度' },
    { type: 'thinking', time: '00:00', title: '拆分为 3 个子任务', detail: '观测 · 检索 · 推理' },
    { type: 'search', time: '00:01', title: '检索太阳风数据库', detail: 'kp-index · bz · flux' },
    { type: 'coding', time: '00:02', title: '运行预测模型', detail: 'plasma · magnetosphere' },
    { type: 'success', time: '00:03', title: '3 个子任务全部完成' },
  ],
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'update:expanded', value: boolean): void
}>()

// 受控/非受控双模式：expanded prop 变化时同步内部状态
const open = ref(props.expanded)
watch(
  () => props.expanded,
  (v) => (open.value = v),
)

function toggle() {
  open.value = !open.value
  emit('toggle')
  emit('update:expanded', open.value)
}

// 左侧竖线的成长高度：每行 24px 间距（20px 行高 + 4px gap），行数确定
const lineHeight = computed(() => `${props.steps.length * 24 - 4}px`)

// 步骤类型 → 状态点颜色
const typeClass = (t: ThinkingStep['type']) => `yz-thinking__dot--${t}`
</script>

<template>
  <div class="yz-thinking">
    <button
      type="button"
      class="yz-thinking__toggle"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg
        class="yz-thinking__spark"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="var(--yz-ink-2)"
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
      </svg>
      <span class="yz-thinking__label">{{ label }}</span>
      <YzIcon
        name="chevron-down"
        :size="14"
        :stroke-width="2.2"
        class="yz-thinking__chevron"
        :class="{ 'yz-thinking__chevron--open': open }"
      />
    </button>

    <div
      class="yz-thinking__collapse"
      :class="{ 'yz-thinking__collapse--open': open }"
    >
      <div class="yz-thinking__viewport">
        <div class="yz-thinking__track">
          <span
            aria-hidden="true"
            class="yz-thinking__line"
            :class="{ 'yz-thinking__line--open': open }"
            :style="{ height: open ? lineHeight : '0px' }"
          />
          <div class="yz-thinking__steps">
            <div
              v-for="(step, i) in steps"
              :key="i"
              class="yz-thinking__step"
            >
              <span class="yz-thinking__dot" :class="typeClass(step.type)" aria-hidden="true" />
              <span class="yz-thinking__time">{{ step.time }}</span>
              <span class="yz-thinking__title">{{ step.title }}</span>
              <span v-if="step.detail" class="yz-thinking__detail">{{ step.detail }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 根容器（beautifului: flex min-h-[176px] w-full max-w-95 flex-col） */
.yz-thinking {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  min-height: 176px;
}

/* 折叠开关（beautifului: -mx-1.5 flex w-fit items-center gap-2 rounded-control px-1.5 py-1） */
.yz-thinking__toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin: 0 -6px;
  padding: 4px 6px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-thinking__toggle:hover {
  background: var(--yz-hover-2);
}

/* 渐变扫光标题（beautifului: bg-clip-text + shimmer-text 1.4s linear） */
.yz-thinking__label {
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

/* 箭头：展开旋转 180deg（beautifului: transition-transform duration-300） */
.yz-thinking__chevron {
  color: var(--yz-ink-3);
  transition: transform 300ms var(--yz-ease-out-strong);
}
.yz-thinking__chevron--open {
  transform: rotate(180deg);
}

/* 折叠区：grid-rows 0fr/1fr + opacity（beautifului: duration-400 cubic-bezier(0.23,1,0.32,1)） */
.yz-thinking__collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 400ms var(--yz-ease-out-strong), opacity 400ms var(--yz-ease-out-strong);
}
.yz-thinking__collapse--open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.yz-thinking__viewport {
  overflow: hidden;
}

/* 步骤轨道（beautifului: relative mt-1 ml-[5px] pl-4） */
.yz-thinking__track {
  position: relative;
  margin-top: 4px;
  margin-left: 5px;
  padding-left: 16px;
}

/* 左侧竖线（beautifului: absolute w-px bg-line，height 0→N 过渡 500ms） */
.yz-thinking__line {
  position: absolute;
  top: -8px;
  left: 3px;
  width: 1px;
  background: var(--yz-line);
  transition: height 500ms var(--yz-ease-out-strong);
}

/* 步骤行（beautifului: flex flex-col gap-1 py-1；行内 20px 行高 + 4px gap） */
.yz-thinking__steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
}
.yz-thinking__step {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 20px;
}
.yz-thinking__dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--yz-ink-3);
}
.yz-thinking__dot--thinking { background: var(--yz-ink-3); }
.yz-thinking__dot--search { background: var(--yz-tag-blue); }
.yz-thinking__dot--coding { background: var(--yz-tag-purple); }
.yz-thinking__dot--success { background: var(--yz-green); }

.yz-thinking__time {
  flex-shrink: 0;
  font-family: var(--yz-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}
.yz-thinking__title {
  font-size: 12.5px;
  color: var(--yz-ink-2);
  white-space: nowrap;
}
.yz-thinking__detail {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--yz-font-mono);
  font-size: 11px;
  color: var(--yz-ink-3);
}

/* 动效开关：关闭时停掉扫光/旋转/折叠过渡 */
@media (prefers-reduced-motion: reduce) {
  .yz-thinking__label,
  .yz-thinking__chevron {
    animation: none;
  }
  .yz-thinking__collapse,
  .yz-thinking__line,
  .yz-thinking__chevron {
    transition: none;
  }
}
</style>
