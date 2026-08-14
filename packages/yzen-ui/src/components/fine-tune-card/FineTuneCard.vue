<script setup lang="ts">
// YzFineTuneCard — Fine-tune Card 微调卡片（移植自 beautifului.dev Fine-tune Card）
// 设计检查器风格卡片：布局分段控件（滑动指示条）+ 参数滑块/输入（W/H/Radius/Opacity，
// 键盘方向键与拖拽均可用）+ Type 下拉。所有参数受控：内部修改同步 emit update:xxx
// （评审铁律）；下拉关闭监听带 isInViewport 可见性门控（评审 C1 I-1）
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

export type TuneLayout = 'row' | 'col' | 'grid'
export type TuneParamKey = 'width' | 'height' | 'radius' | 'opacity'

export interface TuneParam {
  key: TuneParamKey
  /** 滑块字母（beautifului: W / H / Radius / Opacity） */
  label: string
  min: number
  max: number
  /** 步进（方向键/拖拽） */
  step?: number
  /** 后缀（如 "%"） */
  suffix?: string
}

const LAYOUTS: TuneLayout[] = ['row', 'col', 'grid']

interface FineTuneCardProps {
  title?: string
  /** 渐变扫光按钮文案（beautifului: Adjust） */
  adjustText?: string
  layout?: TuneLayout
  /** 参数定义（数据驱动；默认 W/H/Radius/Opacity 对齐源数值 324/96/28/100） */
  params?: TuneParam[]
  /** 参数受控值 */
  width?: number
  height?: number
  radius?: number
  opacity?: number
  /** Type 下拉当前值（'' 显示 "Select type"） */
  type?: string
  /** Type 下拉选项（文案与菜单同源，评审 C1 I-2） */
  types?: string[]
  /** Type 下拉当前值为空时的占位文案 */
  typePlaceholder?: string
  /** 下拉是否展开（受控/非受控双模式） */
  open?: boolean
}

const props = withDefaults(defineProps<FineTuneCardProps>(), {
  title: 'Flavor card',
  adjustText: 'Adjust',
  layout: 'row',
  params: () => [
    { key: 'width', label: 'W', min: 40, max: 999, step: 1 },
    { key: 'height', label: 'H', min: 24, max: 999, step: 1 },
    { key: 'radius', label: 'Radius', min: 0, max: 64, step: 1 },
    { key: 'opacity', label: 'Opacity', min: 0, max: 100, step: 5, suffix: '%' },
  ],
  width: 324,
  height: 96,
  radius: 28,
  opacity: 100,
  type: '',
  types: () => ['观测文本', '光谱图像', '遥测流'],
  typePlaceholder: 'Select type',
  open: false,
})

const emit = defineEmits<{
  (e: 'update:layout', value: TuneLayout): void
  (e: 'change', value: TuneLayout): void
  (e: 'update:width', value: number): void
  (e: 'update:height', value: number): void
  (e: 'update:radius', value: number): void
  (e: 'update:opacity', value: number): void
  (e: 'update:type', value: string): void
  (e: 'update:open', value: boolean): void
}>()

// --- 布局分段控件（受控/非受控双模式） ---
const layout = ref<TuneLayout>(props.layout)
watch(
  () => props.layout,
  (v) => (layout.value = v),
)
const layoutIndex = computed(() => Math.max(0, LAYOUTS.indexOf(layout.value)))

function pickLayout(l: TuneLayout) {
  if (l === layout.value) return
  layout.value = l
  emit('update:layout', l)
  emit('change', l)
}

// --- 参数值（受控/非受控双模式；raw 字符串态供输入框编辑） ---
const raw = reactive<Record<string, string>>({})
const propsOf = (key: TuneParamKey): number => {
  switch (key) {
    case 'width':
      return props.width
    case 'height':
      return props.height
    case 'radius':
      return props.radius
    default:
      return props.opacity
  }
}
const paramOf = (key: TuneParamKey): TuneParam =>
  props.params.find((p) => p.key === key) ?? { key, label: key, min: 0, max: 999 }

function syncRaw(key: TuneParamKey) {
  raw[key] = String(propsOf(key))
}
for (const p of props.params) syncRaw(p.key)
watch(
  () => props.params,
  () => {
    for (const p of props.params) syncRaw(p.key)
  },
)
for (const p of props.params) {
  watch(() => propsOf(p.key), () => syncRaw(p.key))
}

function commitValue(key: TuneParamKey, v: number) {
  raw[key] = String(v)
  ;(emit as unknown as (e: string, v: number) => void)(`update:${key}`, v)
}

function clamp(key: TuneParamKey, v: number): number {
  const p = paramOf(key)
  return Math.max(p.min, Math.min(p.max, v))
}

/** 输入编辑：合法数字即时同步（不截断，便于输入），blur 时夹取 */
function onParamInput(key: TuneParamKey, e: Event) {
  const v = (e.target as HTMLInputElement).value
  raw[key] = v
  if (v.trim() === '') return
  const n = Number(v)
  if (!Number.isNaN(n)) commitValue(key, n)
}

function onParamBlur(key: TuneParamKey) {
  const n = Number(raw[key])
  if (Number.isNaN(n)) {
    raw[key] = String(propsOf(key))
    return
  }
  const clamped = clamp(key, n)
  raw[key] = String(clamped)
  if (clamped !== n) commitValue(key, clamped)
}

/** 滑块键盘（role=slider：方向键/Page/Home/End） */
function onSliderKeydown(key: TuneParamKey, e: KeyboardEvent) {
  const p = paramOf(key)
  const step = p.step ?? 1
  const current = Number.isNaN(Number(raw[key])) ? propsOf(key) : Number(raw[key])
  let next = current
  switch (e.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      next = current + step
      break
    case 'ArrowDown':
    case 'ArrowLeft':
      next = current - step
      break
    case 'PageUp':
      next = current + step * 10
      break
    case 'PageDown':
      next = current - step * 10
      break
    case 'Home':
      next = p.min
      break
    case 'End':
      next = p.max
      break
    default:
      return
  }
  e.preventDefault()
  commitValue(key, clamp(key, next))
}

/** 滑块拖拽（label 即滑轨；pointer capture 平滑连续） */
function onSliderPointerDown(key: TuneParamKey, e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const p = paramOf(key)
  const rect = el.getBoundingClientRect()
  if (!rect || rect.width <= 0) return
  el.setPointerCapture(e.pointerId)
  const apply = (ev: PointerEvent) => {
    const ratio = (ev.clientX - rect.left) / rect.width
    const v = Math.round(p.min + ratio * (p.max - p.min))
    commitValue(key, clamp(key, v))
  }
  const stop = () => {
    el.removeEventListener('pointermove', apply)
    el.removeEventListener('pointerup', stop)
  }
  el.addEventListener('pointermove', apply)
  el.addEventListener('pointerup', stop)
}

// --- Type 下拉（受控/非受控双模式；菜单打开态带 isInViewport 门控） ---
const open = ref(props.open)
watch(
  () => props.open,
  (v) => (open.value = v),
)
const type = ref(props.type)
watch(
  () => props.type,
  (v) => (type.value = v),
)
const menuEl = ref<HTMLElement | null>(null)

function pickType(t: string) {
  type.value = t
  emit('update:type', t)
  open.value = false
  emit('update:open', false)
}

function toggleMenu() {
  open.value = !open.value
  emit('update:open', open.value)
}

const rootEl = ref<HTMLElement | null>(null)

function isInViewport(): boolean {
  const el = rootEl.value
  if (!el || typeof window === 'undefined') return false
  const rect = el.getBoundingClientRect()
  return (
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  )
}

// 菜单外点击关闭（评审 C1 I-1：全局监听需可见性门控）
function onDocPointerDown(e: PointerEvent) {
  if (!open.value || !isInViewport()) return
  const t = e.target as Node
  if (rootEl.value && !rootEl.value.contains(t)) {
    open.value = false
    emit('update:open', false)
  }
}

// Escape 关闭（门控同上，避免与其他组件的 Escape 处理冲突）
function onDocKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value && isInViewport()) {
    open.value = false
    emit('update:open', false)
    menuEl.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
  window.addEventListener('keydown', onDocKeydown)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
  window.removeEventListener('keydown', onDocKeydown)
})
</script>

<template>
  <!-- 卡片（beautifului: relative w-full max-w-60 rounded-card bg-surface shadow-raised） -->
  <div ref="rootEl" class="yz-fine-tune-card">
    <!-- 卡片头（beautifului: primitive-card-bar flex items-center justify-between border-b border-line） -->
    <div class="yz-fine-tune-card__bar">
      <span class="yz-fine-tune-card__title">{{ title }}</span>
      <span class="yz-fine-tune-card__badge-group">
        <span class="yz-fine-tune-card__badge" aria-hidden="true">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--yz-accent)">
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
          </svg>
        </span>
        <span class="yz-fine-tune-card__shimmer">{{ adjustText }}</span>
      </span>
    </div>

    <!-- 卡片主体（beautifului: primitive-card-pad flex flex-col gap-2 border-b border-line） -->
    <div class="yz-fine-tune-card__pad">
      <p class="yz-fine-tune-card__section-label">Layout</p>

      <!-- 布局分段控件（beautifului: relative grid grid-cols-3 rounded-control bg-field p-0.5） -->
      <div class="yz-fine-tune-card__segmented" role="group" aria-label="Layout">
        <span
          aria-hidden="true"
          class="yz-fine-tune-card__thumb"
          :style="{ transform: `translateX(${layoutIndex * 100}%)` }"
        />
        <button
          v-for="l in LAYOUTS"
          :key="l"
          type="button"
          class="yz-fine-tune-card__layout-btn"
          :class="{ 'yz-fine-tune-card__layout-btn--active': layout === l }"
          :aria-label="`${l} layout`"
          :aria-pressed="layout === l"
          @click="pickLayout(l)"
        >
          <span v-if="l === 'row'" class="yz-fine-tune-card__layout-icons yz-fine-tune-card__layout-icons--row">
            <span v-for="i in 3" :key="i" class="yz-fine-tune-card__layout-dot" />
          </span>
          <span v-else-if="l === 'col'" class="yz-fine-tune-card__layout-icons yz-fine-tune-card__layout-icons--col">
            <span v-for="i in 2" :key="i" class="yz-fine-tune-card__layout-dot" />
          </span>
          <span v-else class="yz-fine-tune-card__layout-icons yz-fine-tune-card__layout-icons--grid">
            <span v-for="i in 4" :key="i" class="yz-fine-tune-card__layout-dot" />
          </span>
        </button>
      </div>

      <!-- 参数 2×2（beautifului: grid min-w-0 grid-cols-2 gap-2） -->
      <div class="yz-fine-tune-card__params">
        <label
          v-for="p in params"
          :key="p.key"
          class="yz-fine-tune-card__param"
          :data-param="p.key"
          @pointerdown="onSliderPointerDown(p.key, $event)"
        >
          <span
            role="slider"
            class="yz-fine-tune-card__slider"
            :aria-label="p.label"
            :aria-valuenow="propsOf(p.key)"
            :aria-valuemin="p.min"
            :aria-valuemax="p.max"
            :tabindex="0"
            @keydown="onSliderKeydown(p.key, $event)"
          >{{ p.label }}</span>
          <input
            type="number"
            inputmode="numeric"
            class="yz-fine-tune-card__input"
            :aria-label="`${p.label} value`"
            :min="p.min"
            :max="p.max"
            :value="raw[p.key]"
            @input="onParamInput(p.key, $event)"
            @blur="onParamBlur(p.key)"
          />
          <span v-if="p.suffix" class="yz-fine-tune-card__suffix">{{ p.suffix }}</span>
        </label>
      </div>
    </div>

    <!-- 卡片脚（beautifului: primitive-card-footer flex items-center justify-between） -->
    <div class="yz-fine-tune-card__footer">
      <span class="yz-fine-tune-card__type-label">Type</span>
      <div class="yz-fine-tune-card__select-wrap">
        <button
          type="button"
          class="yz-fine-tune-card__select"
          :class="{ 'yz-fine-tune-card__select--open': open }"
          :aria-expanded="open"
          aria-haspopup="listbox"
          @click="toggleMenu"
        >
          <span class="yz-fine-tune-card__select-text" :class="{ 'yz-fine-tune-card__select-text--placeholder': !type }">
            {{ type || typePlaceholder }}
          </span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <!-- 下拉菜单（yz-pop-in 入场；选项与 types prop 同源） -->
        <div
          v-if="open"
          ref="menuEl"
          class="yz-fine-tune-card__menu"
          role="listbox"
          :aria-label="typePlaceholder"
        >
          <button
            v-for="t in types"
            :key="t"
            type="button"
            role="option"
            class="yz-fine-tune-card__menu-option"
            :class="{ 'yz-fine-tune-card__menu-option--selected': t === type }"
            :aria-selected="t === type"
            @click="pickType(t)"
          >
            <span class="yz-fine-tune-card__menu-check" aria-hidden="true">
              <svg v-if="t === type" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12.5l5 5L20 6.5" />
              </svg>
            </span>
            <span class="yz-fine-tune-card__menu-label">{{ t }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 卡片（beautifului: relative w-full max-w-60 rounded-card bg-surface shadow-raised） */
.yz-fine-tune-card {
  position: relative;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-raised);
}

/* 卡片头（beautifului: flex items-center justify-between border-b border-line px-3 py-2） */
.yz-fine-tune-card__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-fine-tune-card__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--yz-ink);
}
.yz-fine-tune-card__badge-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
/* 星标徽章（beautifului: size-4.5 rounded-[5px] border border-accent/30 bg-accent-tint） */
.yz-fine-tune-card__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid color-mix(in srgb, var(--yz-accent) 30%, transparent);
  background: var(--yz-accent-tint);
}
/* 渐变扫光文案（beautifului: bg-clip-text shimmer-text 1.4s linear infinite） */
.yz-fine-tune-card__shimmer {
  background-image: linear-gradient(90deg, var(--yz-accent) 35%, var(--yz-accent-ink) 50%, var(--yz-accent) 65%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 12px;
  font-weight: 500;
  animation: yz-shimmer-text 1.4s linear infinite;
}

/* 卡片主体（beautifului: flex flex-col gap-2 border-b border-line p-3） */
.yz-fine-tune-card__pad {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-fine-tune-card__section-label {
  margin: 0;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--yz-ink);
}

/* 分段控件（beautifului: relative grid grid-cols-3 rounded-control bg-field p-0.5） */
.yz-fine-tune-card__segmented {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-radius: var(--yz-radius-control);
  background: var(--yz-field);
  padding: 2px;
}
/* 滑动指示条（beautifului: absolute inset-y-0.5 rounded-[6px] bg-surface shadow-btn，
   width calc((100% - 4px)/3) left 2px，translateX(0/100/200%)，300ms cubic-bezier(0.23,1,0.32,1)） */
.yz-fine-tune-card__thumb {
  position: absolute;
  inset: 2px auto 2px 2px;
  width: calc((100% - 4px) / 3);
  border-radius: 6px;
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.yz-fine-tune-card__layout-btn {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: color 200ms var(--yz-ease-out-strong);
}
.yz-fine-tune-card__layout-btn--active {
  color: var(--yz-accent);
}
.yz-fine-tune-card__layout-btn:not(.yz-fine-tune-card__layout-btn--active) {
  color: var(--yz-ink-3);
}
.yz-fine-tune-card__layout-icons {
  display: flex;
  gap: 2px;
}
.yz-fine-tune-card__layout-icons--row {
  flex-direction: row;
}
.yz-fine-tune-card__layout-icons--col {
  flex-direction: column;
}
.yz-fine-tune-card__layout-icons--grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
}
/* 布局点（beautifului: size-1.5 rounded-[2px] border-[1.2px] border-current） */
.yz-fine-tune-card__layout-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  border: 1.2px solid currentColor;
}

/* 参数 2×2（beautifului: grid min-w-0 grid-cols-2 gap-2） */
.yz-fine-tune-card__params {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
/* 参数胶囊（beautifului: flex h-6.5 min-w-0 items-center gap-1 rounded-chip py-1 pr-1 pl-0.5，
   bg field，hover 发丝线；label 即拖拽滑轨） */
.yz-fine-tune-card__param {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  height: 26px;
  padding: 4px 4px 4px 2px;
  border-radius: var(--yz-radius-chip);
  background: var(--yz-field);
  touch-action: none;
  cursor: ew-resize;
  transition: box-shadow 200ms var(--yz-ease-out-strong), background-color 200ms var(--yz-ease-out-strong);
}
.yz-fine-tune-card__param:hover {
  box-shadow: 0 0 0 1px var(--yz-line-strong);
}
/* 滑块字母（beautifului: role=slider 高亮态 accent） */
.yz-fine-tune-card__slider {
  display: flex;
  align-items: center;
  align-self: stretch;
  flex-shrink: 0;
  border-radius: 4px;
  padding: 0 2px;
  font-size: 12px;
  color: var(--yz-ink-3);
  user-select: none;
  -webkit-user-select: none;
  transition: color 100ms var(--yz-ease-out-strong);
}
.yz-fine-tune-card__slider:hover {
  color: var(--yz-ink-2);
}
.yz-fine-tune-card__slider:focus-visible {
  outline: none;
  color: var(--yz-accent-ink);
}
/* 数值输入（beautifului: min-w-0 flex-1 bg-transparent text-[12px] text-ink tabular-nums outline-none） */
.yz-fine-tune-card__input {
  min-width: 0;
  flex: 1;
  width: 100%;
  border: none;
  background: transparent;
  font-size: 12px;
  font-family: var(--yz-font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink);
  outline: none;
}
.yz-fine-tune-card__input::-webkit-inner-spin-button,
.yz-fine-tune-card__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.yz-fine-tune-card__input {
  -moz-appearance: textfield;
  appearance: textfield;
}
.yz-fine-tune-card__suffix {
  flex-shrink: 0;
  padding-right: 2px;
  font-size: 11.5px;
  color: var(--yz-ink-3);
}

/* 卡片脚（beautifului: flex items-center justify-between p-3） */
.yz-fine-tune-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
}
.yz-fine-tune-card__type-label {
  font-size: 12px;
  color: var(--yz-ink-3);
}
.yz-fine-tune-card__select-wrap {
  position: relative;
  margin-right: -2px;
  width: 120px;
}
/* 下拉按钮（beautifului: flex h-6.5 w-full items-center justify-between rounded-chip bg-inset py-1 pr-1 pl-2 shadow-hairline） */
.yz-fine-tune-card__select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 26px;
  padding: 4px 4px 4px 8px;
  border: none;
  border-radius: var(--yz-radius-chip);
  background: var(--yz-inset);
  box-shadow: 0 0 0 1px var(--yz-line);
  font-size: 12px;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: box-shadow 200ms var(--yz-ease-out-strong);
}
.yz-fine-tune-card__select:hover {
  box-shadow: 0 0 0 1px var(--yz-line-strong);
}
.yz-fine-tune-card__select--open {
  box-shadow: 0 0 0 1px var(--yz-accent);
}
.yz-fine-tune-card__select-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--yz-ink);
}
.yz-fine-tune-card__select-text--placeholder {
  color: var(--yz-ink-3);
}
.yz-fine-tune-card__select svg {
  flex-shrink: 0;
  transition: transform 200ms var(--yz-ease-out-strong);
}
.yz-fine-tune-card__select--open svg {
  transform: rotate(180deg);
}

/* 下拉菜单（beautifului: 悬浮层 bg-surface shadow-overlay，yz-pop-in 入场） */
.yz-fine-tune-card__menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 20;
  min-width: 120px;
  padding: 2px;
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-overlay);
  animation: yz-pop-in 150ms var(--yz-ease-out-strong) both;
}
.yz-fine-tune-card__menu-option {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 26px;
  padding: 0 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  color: var(--yz-ink-2);
  text-align: left;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-fine-tune-card__menu-option:hover {
  background: var(--yz-hover);
}
.yz-fine-tune-card__menu-option--selected {
  color: var(--yz-ink);
  font-weight: 500;
}
.yz-fine-tune-card__menu-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 10px;
  flex-shrink: 0;
  color: var(--yz-accent);
}
.yz-fine-tune-card__menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 动效开关 */
@media (prefers-reduced-motion: reduce) {
  .yz-fine-tune-card__shimmer {
    animation: none;
  }
  .yz-fine-tune-card__thumb,
  .yz-fine-tune-card__layout-btn,
  .yz-fine-tune-card__param,
  .yz-fine-tune-card__slider,
  .yz-fine-tune-card__select,
  .yz-fine-tune-card__select svg,
  .yz-fine-tune-card__menu-option {
    transition: none;
  }
  .yz-fine-tune-card__menu {
    animation: none;
  }
}
</style>
