<script setup lang="ts">
// YzSpin demo：
// - 样式 A：Auto 开关 + 手动模式 percent 每 100ms +5 循环（-50 → 150），三尺寸并排
// - 样式 B：容器模式（antd Container demo）——Spin 包裹内容块三尺寸对比 + Alert 嵌套
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { YzSpin } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
const isContainer = computed(() => active.value.type === 'container')

// Auto 开关（自绘 Switch，antd checkedChildren="Auto"）
const auto = ref(false)

// 手动模式：percent 每 100ms +5，超过 150 回到 -50（依赖 percent 重置定时器）
const percent = ref(-50)
let timer: ReturnType<typeof setTimeout> | null = null

// 变体驱动初始状态：auto 变体 → 开启 Auto；progress/classic 变体 → 固定数字进度
watch(
  active,
  (p) => {
    stop()
    if (p.percent === 'auto') {
      auto.value = true
      percent.value = -50
    } else {
      auto.value = false
      percent.value = typeof p.percent === 'number' ? p.percent : -50
    }
  },
  { immediate: true },
)

watch(percent, () => {
  if (auto.value) return
  timer = setTimeout(() => {
    percent.value = ((v) => (v + 5 > 150 ? -50 : v + 5))(percent.value)
  }, 100)
})

function stop() {
  if (timer) clearTimeout(timer)
  timer = null
}
onBeforeUnmount(stop)

function toggleAuto() {
  auto.value = !auto.value
  percent.value = -50
}

const mergedPercent = computed(() => (auto.value ? ('auto' as const) : percent.value))
</script>

<template>
  <!-- 样式 B：容器模式——Spin 包裹内容块（三尺寸对比 + Alert 嵌套） -->
  <div v-if="isContainer" class="sp-demo sp-demo--container">
    <div class="sp-demo__row">
      <YzSpin tip="Loading" size="small">
        <div class="sp-block" />
      </YzSpin>
      <YzSpin tip="Loading">
        <div class="sp-block" />
      </YzSpin>
      <YzSpin tip="Loading" size="large">
        <div class="sp-block" />
      </YzSpin>
    </div>
    <YzSpin tip="Loading...">
      <div class="sp-alert">
        <div class="sp-alert__icon">i</div>
        <div class="sp-alert__body">
          <p class="sp-alert__title">Alert message title</p>
          <p class="sp-alert__desc">Further details about the context of this alert.</p>
        </div>
      </div>
    </YzSpin>
  </div>

  <!-- 样式 A：Auto 开关 + 三尺寸进度 -->
  <div v-else class="sp-demo">
    <div class="sp-demo__row">
      <!-- Auto 开关（自绘 Switch：胶囊 + 滑块 + Auto 文本） -->
      <button
        type="button"
        class="sp-switch"
        :class="{ 'sp-switch--on': auto }"
        role="switch"
        :aria-checked="auto"
        @click="toggleAuto"
      >
        <span class="sp-switch__thumb" />
        <span class="sp-switch__label">Auto</span>
      </button>
      <YzSpin :percent="mergedPercent" size="small" />
      <YzSpin :percent="mergedPercent" />
      <YzSpin :percent="mergedPercent" size="large" />
    </div>
    <p class="sp-demo__note">
      {{ auto ? 'Auto mode: estimated never-stopping progress' : `${mergedPercent}%` }}
    </p>
  </div>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.sp-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.sp-demo__row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

/* 自绘 Switch（仿 antd：胶囊 + 滑块 + Auto 文本） */
.sp-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 60px;
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 99px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line-strong);
  cursor: pointer;
  transition: background-color 150ms $yz-ease-out-strong;
}
.sp-switch__thumb {
  position: absolute;
  left: 3px;
  top: 3px;
  width: 20px;
  height: 20px;
  border-radius: 99px;
  background: var(--yz-surface);
  box-shadow: 0 1px 2px #1018281f;
  transition: transform 200ms $yz-ease-out-strong;
}
.sp-switch--on {
  background: var(--yz-accent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--yz-accent) 60%, transparent);
}
.sp-switch--on .sp-switch__thumb {
  transform: translateX(34px);
}
.sp-switch__label {
  position: relative;
  z-index: 1;
  margin-left: 26px;
  font-size: 12px;
  font-weight: 600;
  color: var(--yz-ink-2);
  transition: color 150ms $yz-ease-out-strong;
}
.sp-switch--on .sp-switch__label {
  margin-left: 0;
  color: #fff;
}

.sp-demo__note {
  margin: 0;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  color: var(--yz-ink-3);
}

/* 样式 B：容器模式内容块（antd contentStyle：padding 50 + 灰底 + 圆角） */
.sp-demo--container {
  gap: 20px;
}
.sp-block {
  width: 200px;
  height: 120px;
  background: color-mix(in srgb, var(--yz-ink) 5%, transparent);
  border-radius: 8px;
}

/* 自绘 info Alert（antd Alert type="info"：accent 淡染 + 左侧信息条） */
.sp-alert {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--yz-accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--yz-accent) 25%, transparent);
  text-align: left;
}
.sp-alert__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border-radius: 99px;
  background: var(--yz-accent);
  color: #fff;
  font-family: var(--yz-font-mono);
  font-size: 12px;
  font-weight: 600;
}
.sp-alert__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--yz-ink);
}
.sp-alert__desc {
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--yz-ink-2);
}
</style>
