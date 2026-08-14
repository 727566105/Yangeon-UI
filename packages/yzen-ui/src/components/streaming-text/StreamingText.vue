<script setup lang="ts">
// YzStreamingText — Streaming Text 流式文本（移植自 beautifului.dev Streaming Text）
// 打字机逐段 reveal 的回答文本：光标闪烁 → 完成后浮现操作按钮、来源折叠面板与追问建议
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { YzIcon } from '../../index'

export interface StreamSource {
  /** 来源名称（等宽展示） */
  name: string
  /** 来源域名，右侧等宽小字 */
  url: string
  /** 头像色块色值 */
  color: string
  /** 头像字母 */
  initial: string
}

interface StreamingTextProps {
  /** 完整回答文本 */
  text?: string
  /** 是否打字机流式 reveal（false 时整段立即显示） */
  streaming?: boolean
  /** 每 tick 间隔 ms */
  speed?: number
  /** 每 tick 揭示字符数 */
  chunkSize?: number
  /** 来源列表（折叠面板 + 计数按钮） */
  sources?: StreamSource[]
  /** 追问建议列表 */
  followUps?: string[]
  /** 是否显示操作按钮（复制/刷新/赞/踩） */
  actions?: boolean
  /** 来源面板折叠（受控/非受控双模式） */
  sourcesOpen?: boolean
}

const props = withDefaults(defineProps<StreamingTextProps>(), {
  text: '基于太阳风与地磁台网的实时数据，今夜极光活动指数 kp-index 升至 5.7，bz 持续负偏（-6.2nT），预计 22:40 起可见概率 78%，峰值强度将高于近 7 夜均值 +18%。',
  streaming: true,
  speed: 24,
  chunkSize: 2,
  sources: () => [
    { name: 'Solar Wind', url: 'solarwind.gov', color: '#1f7a5f', initial: 'S' },
    { name: 'Geomag Grid', url: 'geomag.org', color: '#2f6fec', initial: 'G' },
    { name: 'Aurora Radar', url: 'aurora-radar.io', color: '#e56d24', initial: 'A' },
  ],
  followUps: () => ['明晚极光可见概率如何？', '对比 3 月峰值与今夜强度'],
  actions: true,
  sourcesOpen: false,
})

const emit = defineEmits<{
  (e: 'done'): void
  (e: 'copy'): void
  (e: 'refresh'): void
  (e: 'like', liked: boolean): void
  (e: 'dislike', disliked: boolean): void
  (e: 'followup', text: string): void
  (e: 'toggle', open: boolean): void
  (e: 'update:sourcesOpen', open: boolean): void
}>()

// 动效开关：prefers-reduced-motion 时整段立即显示（不跑打字机）
function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  } catch {
    return false
  }
}

const textLen = computed(() => props.text.length)

// 无需逐段揭示：reduced-motion / streaming 关闭 / 速度异常 → 整段立即显示
function revealInstantly(): boolean {
  return prefersReducedMotion() || !props.streaming || props.speed <= 0 || props.chunkSize <= 0
}

// 初始状态在 setup 时确定，首帧即正确（不依赖 onMounted 后的重渲染）
const shown = ref(revealInstantly() ? textLen.value : 0)
const done = computed(() => shown.value >= textLen.value)

let timer: ReturnType<typeof setInterval> | null = null

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 打字机：定时器逐段 reveal（chunkSize 字符/tick）
function startStream() {
  stopTimer()
  if (revealInstantly()) return
  if (shown.value >= textLen.value) return
  timer = setInterval(() => {
    shown.value = Math.min(textLen.value, shown.value + props.chunkSize)
    if (shown.value >= textLen.value) stopTimer()
  }, props.speed)
}

onMounted(startStream)
onUnmounted(stopTimer)
watch(
  () => props.text,
  () => {
    shown.value = revealInstantly() ? textLen.value : 0
    startStream()
  },
)

// 完成时冒泡一次
watch(done, (v) => {
  if (v) emit('done')
})

// 来源面板折叠（受控/非受控双模式，同 YzThinking/YzToolChips）
const sourcesOpen = ref(props.sourcesOpen)
watch(
  () => props.sourcesOpen,
  (v) => (sourcesOpen.value = v),
)

function toggleSources() {
  sourcesOpen.value = !sourcesOpen.value
  emit('toggle', sourcesOpen.value)
  emit('update:sourcesOpen', sourcesOpen.value)
}

// 赞/踩互斥状态
const liked = ref(false)
const disliked = ref(false)

function toggleLike() {
  liked.value = !liked.value
  if (liked.value) disliked.value = false
  emit('like', liked.value)
}

function toggleDislike() {
  disliked.value = !disliked.value
  if (disliked.value) liked.value = false
  emit('dislike', disliked.value)
}
</script>

<template>
  <div class="yz-streaming-text">
    <!-- 回答正文：已揭示文本 + 光标 -->
    <p class="yz-streaming-text__body" role="status" aria-live="polite">
      <span class="yz-streaming-text__content">{{ text.slice(0, shown) }}</span>
      <span
        class="yz-streaming-text__caret"
        :class="{ 'yz-streaming-text__caret--done': done }"
        aria-hidden="true"
      />
    </p>

    <!-- 操作区：完成后淡入（复制/刷新/赞/踩 + 来源计数） -->
    <div
      class="yz-streaming-text__actions"
      :class="{ 'yz-streaming-text__actions--visible': done }"
    >
      <button
        v-if="actions"
        type="button"
        class="yz-streaming-text__action"
        aria-label="复制回答"
        @click="emit('copy')"
      >
        <YzIcon name="copy" :size="15" />
      </button>
      <button
        v-if="actions"
        type="button"
        class="yz-streaming-text__action"
        aria-label="重新生成"
        @click="emit('refresh')"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
        </svg>
      </button>
      <button
        v-if="actions"
        type="button"
        class="yz-streaming-text__action"
        :class="{ 'yz-streaming-text__action--active': liked }"
        :aria-pressed="liked"
        aria-label="有帮助"
        @click="toggleLike"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" />
        </svg>
      </button>
      <button
        v-if="actions"
        type="button"
        class="yz-streaming-text__action"
        :class="{ 'yz-streaming-text__action--active': disliked }"
        :aria-pressed="disliked"
        aria-label="没有帮助"
        @click="toggleDislike"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" />
        </svg>
      </button>

      <!-- 来源计数：堆叠头像 + N sources -->
      <button
        type="button"
        class="yz-streaming-text__sources-btn"
        :aria-expanded="sourcesOpen"
        aria-label="查看来源"
        @click="toggleSources"
      >
        <span class="yz-streaming-text__avatars" aria-hidden="true">
          <span
            v-for="(s, i) in sources"
            :key="i"
            class="yz-streaming-text__avatar"
            :style="{ background: s.color }"
          >{{ s.initial }}</span>
        </span>
        <span class="yz-streaming-text__sources-count">{{ sources.length }} sources</span>
      </button>
    </div>

    <!-- 来源折叠面板：grid-rows 0fr/1fr + opacity（beautifului: duration-300） -->
    <div
      class="yz-streaming-text__collapse"
      :class="{ 'yz-streaming-text__collapse--open': sourcesOpen }"
    >
      <div class="yz-streaming-text__viewport">
        <div class="yz-streaming-text__sources">
          <a
            v-for="(s, i) in sources"
            :key="i"
            :href="`https://${s.url}`"
            target="_blank"
            rel="noreferrer"
            class="yz-streaming-text__source"
          >
            <span class="yz-streaming-text__source-chip" :style="{ background: s.color }" aria-hidden="true">
              {{ s.initial }}
            </span>
            <span class="yz-streaming-text__source-name">{{ s.name }}</span>
            <span class="yz-streaming-text__source-url">{{ s.url }}</span>
          </a>
        </div>
      </div>
    </div>

    <!-- 追问建议：完成后淡入 -->
    <div
      class="yz-streaming-text__followups"
      :class="{ 'yz-streaming-text__followups--visible': done }"
    >
      <p class="yz-streaming-text__followups-label">Follow-ups</p>
      <div class="yz-streaming-text__followups-list">
        <button
          v-for="(f, i) in followUps"
          :key="i"
          type="button"
          class="yz-streaming-text__followup"
          @click="emit('followup', f)"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--yz-ink-3)"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="yz-streaming-text__followup-icon"
            aria-hidden="true"
          >
            <path d="M9 10l-5 5 5 5" />
            <path d="M20 4v7a4 4 0 0 1-4 4H4" />
          </svg>
          {{ f }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 根容器（beautifului: w-full max-w-95 min-h-[15.5rem]） */
.yz-streaming-text {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  min-height: 248px;
}

/* 正文（beautifului: text-[13px] leading-relaxed text-ink） */
.yz-streaming-text__body {
  margin: 0;
  font-size: 13px;
  line-height: 1.625;
  color: var(--yz-ink);
  text-wrap: pretty;
}
.yz-streaming-text__content {
  overflow-wrap: anywhere;
}

/* 打字光标（beautifului: ml-0.5 h-3 w-0.5 rounded-full bg-ink） */
.yz-streaming-text__caret {
  display: inline-block;
  width: 2px;
  height: 12px;
  margin-left: 2px;
  border-radius: 99px;
  background: var(--yz-ink);
  vertical-align: baseline;
  animation: yz-caret-blink 1s step-end infinite;
  opacity: 1;
  transition: opacity 400ms var(--yz-ease-out-strong);
}
.yz-streaming-text__caret--done {
  animation: none;
  opacity: 0;
}

/* 操作区：初始隐藏，完成后 400ms 淡入（beautifului: mt-2 flex gap-0.5 transition-opacity duration-400） */
.yz-streaming-text__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 400ms var(--yz-ease-out-strong);
}
.yz-streaming-text__actions--visible {
  opacity: 1;
  pointer-events: auto;
}

/* 操作按钮（beautifului: size-6 rounded-[6px] text-ink-3 hover:bg-hover-2 hover:text-ink-2） */
.yz-streaming-text__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.yz-streaming-text__action:hover {
  background: var(--yz-hover-2);
  color: var(--yz-ink-2);
}
.yz-streaming-text__action--active {
  color: var(--yz-accent);
}

/* 来源计数按钮（beautifului: ml-1.5 flex items-center gap-1.5 rounded-[6px] px-1 py-0.5 hover:bg-hover） */
.yz-streaming-text__sources-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  padding: 2px 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong);
}
.yz-streaming-text__sources-btn:hover {
  background: var(--yz-hover);
}

/* 堆叠头像（beautifului: flex -space-x-1，size-3.5 rounded-full + 1.5px canvas 描边） */
.yz-streaming-text__avatars {
  display: flex;
}
.yz-streaming-text__avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: -2px;
  border-radius: 99px;
  box-shadow: 0 0 0 1.5px var(--yz-canvas);
  font-size: 7px;
  font-weight: 600;
  color: #fff;
}
.yz-streaming-text__avatar:first-child {
  margin-left: 0;
}
.yz-streaming-text__sources-count {
  font-size: 12px;
  color: var(--yz-ink-2);
  white-space: nowrap;
}

/* 来源折叠面板（beautifului: grid transition-[grid-template-rows,opacity] duration-300） */
.yz-streaming-text__collapse {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 300ms var(--yz-ease-out-strong), opacity 300ms var(--yz-ease-out-strong);
}
.yz-streaming-text__collapse--open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.yz-streaming-text__viewport {
  overflow: hidden;
}

/* 来源列表卡片（beautifului: mt-1.5 rounded-[10px] bg-inset p-1 shadow-hairline） */
.yz-streaming-text__sources {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  padding: 4px;
  border-radius: 10px;
  background: var(--yz-inset);
  box-shadow: 0 0 0 1px var(--yz-line);
}

/* 来源行（beautifului: rounded-[6px] px-1.5 py-1 text-[12px] text-ink-2 hover:bg-hover hover:text-ink） */
.yz-streaming-text__source {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 12px;
  color: var(--yz-ink-2);
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.yz-streaming-text__source:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
.yz-streaming-text__source-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 4px;
  font-size: 8px;
  font-weight: 600;
  color: #fff;
}
.yz-streaming-text__source-name {
  font-family: var(--yz-font-mono);
  font-size: 12px;
  white-space: nowrap;
}
.yz-streaming-text__source-url {
  margin-left: auto;
  font-family: var(--yz-font-mono);
  font-size: 10.5px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* 追问建议（beautifului: mt-2.5 transition-opacity duration-400） */
.yz-streaming-text__followups {
  margin-top: 10px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 400ms var(--yz-ease-out-strong);
}
.yz-streaming-text__followups--visible {
  opacity: 1;
  pointer-events: auto;
}
.yz-streaming-text__followups-label {
  margin: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-2);
}
.yz-streaming-text__followups-list {
  display: flex;
  flex-direction: column;
  margin-top: 2px;
}

/* 追问按钮（beautifului: -mx-1.5 gap-2 rounded-[7px] border-b border-line px-1.5 py-1.5 text-[12.5px] hover:bg-hover-2） */
.yz-streaming-text__followup {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 -6px;
  padding: 6px;
  border: none;
  border-bottom: 1px solid var(--yz-line);
  border-radius: 7px;
  background: transparent;
  font: inherit;
  font-size: 12.5px;
  text-align: left;
  color: var(--yz-ink);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-streaming-text__followup:hover {
  background: var(--yz-hover-2);
}
.yz-streaming-text__followup-icon {
  flex-shrink: 0;
}

/* 动效开关：关闭时停掉光标闪烁与过渡 */
@media (prefers-reduced-motion: reduce) {
  .yz-streaming-text__caret,
  .yz-streaming-text__caret--done {
    animation: none;
  }
  .yz-streaming-text__actions,
  .yz-streaming-text__collapse,
  .yz-streaming-text__followups {
    transition: none;
  }
}
</style>
