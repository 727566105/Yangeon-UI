<script setup lang="ts">
// YzChatComposer — Chat Composer 对话输入区（移植自 beautifului.dev Chat Composer）
// 标签页切换 + 推理消息列表（用户气泡/助手行）+ 多行输入与发送；发送后自动追加消息与回复
import { nextTick, onUnmounted, ref, watch } from 'vue'

export interface ChatMessage {
  role: 'user' | 'assistant'
  /** 助手行名称（如「观测数据」） */
  label?: string
  /** 助手行来源标签（等宽，如 kp-index · bz） */
  tag?: string
  /** 耗时展示（如 4s） */
  duration?: string
  text: string
}

export interface ChatTab {
  key: string
  label: string
}

interface ChatComposerProps {
  /** 受控输入文本（v-model） */
  modelValue?: string
  placeholder?: string
  tabs?: ChatTab[]
  /** 受控激活标签（v-model:tab） */
  tab?: string
  messages?: ChatMessage[]
  /** 面板高度 px */
  maxHeight?: number
  /** 发送后自动追加的助手回复（null 关闭） */
  replyText?: string | null
  /** 自动回复延迟 ms */
  replyDelay?: number
}

const props = withDefaults(defineProps<ChatComposerProps>(), {
  modelValue: '',
  placeholder: '输入观测指令，或 @ 传感器…',
  tabs: () => [
    { key: 'observe', label: '观测' },
    { key: 'sensors', label: '传感器' },
  ],
  tab: '',
  messages: () => [
    { role: 'user', text: '对比今晚与上周的极光峰值强度' },
    {
      role: 'assistant',
      label: '观测数据',
      tag: 'kp-index · bz · flux',
      duration: '4s',
      text: '已拉取近 7 夜太阳风记录：kp 峰值 5.4，bz 均值 -6.2nT。',
    },
    {
      role: 'assistant',
      label: '趋势对比',
      tag: '模型预测',
      duration: '2s',
      text: '今夜峰值强度预计 +18%，周末后段减弱。',
    },
  ],
  maxHeight: 288,
  replyText: '已记录本次观测请求，正在比对历史时段数据…',
  replyDelay: 900,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'send', value: string): void
  (e: 'tab', key: string): void
  (e: 'update:tab', key: string): void
  (e: 'action', name: string): void
  (e: 'reply', message: ChatMessage): void
}>()

// --- 输入文本：受控/非受控双模式（内部修改必须同步 emit update:modelValue） ---
const text = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => (text.value = v),
)

function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value
  emit('update:modelValue', text.value)
}

// --- 标签页：受控/非受控双模式 ---
const activeTab = ref(props.tab || props.tabs[0]?.key || '')
watch(
  () => props.tab,
  (v) => {
    if (v) activeTab.value = v
  },
)

function selectTab(key: string) {
  activeTab.value = key
  emit('tab', key)
  emit('update:tab', key)
}

// --- 消息列表：本地副本，父级 messages 变化时同步 ---
const items = ref<ChatMessage[]>(props.messages.map((m) => ({ ...m })))
watch(
  () => props.messages,
  (v) => {
    items.value = v.map((m) => ({ ...m }))
  },
  { deep: true },
)

const listEl = ref<HTMLElement | null>(null)
function scrollToBottom() {
  nextTick(() => {
    const el = listEl.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

// --- 发送：追加用户消息 + 清空（同步 emit）+ 可选自动回复 ---
let replyTimer: ReturnType<typeof setTimeout> | null = null

function scheduleReply() {
  if (replyTimer) clearTimeout(replyTimer)
  replyTimer = setTimeout(() => {
    const reply: ChatMessage = {
      role: 'assistant',
      label: '观测任务',
      tag: '自动回复',
      duration: `${Math.max(1, Math.round(props.replyDelay / 1000))}s`,
      text: props.replyText ?? '',
    }
    items.value.push(reply)
    emit('reply', reply)
    scrollToBottom()
  }, props.replyDelay)
}

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('send', value)
  items.value.push({ role: 'user', text: value })
  scrollToBottom()
  text.value = ''
  emit('update:modelValue', '')
  if (props.replyText) scheduleReply()
}

onUnmounted(() => {
  if (replyTimer) clearTimeout(replyTimer)
})
</script>

<template>
  <div class="yz-chat-composer" :style="{ height: `${maxHeight}px` }">
    <!-- 面板头：标签页 + 右侧操作按钮 -->
    <div class="yz-chat-composer__head">
      <div class="yz-chat-composer__tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          type="button"
          class="yz-chat-composer__tab"
          :class="{ 'yz-chat-composer__tab--active': activeTab === t.key }"
          :aria-pressed="activeTab === t.key"
          @click="selectTab(t.key)"
        >
          {{ t.label }}
        </button>
      </div>
      <div class="yz-chat-composer__head-actions">
        <button
          type="button"
          class="yz-chat-composer__head-btn"
          aria-label="添加附件"
          @click="emit('action', 'attach')"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          class="yz-chat-composer__head-btn"
          aria-label="历史记录"
          @click="emit('action', 'history')"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
        <button
          type="button"
          class="yz-chat-composer__head-btn"
          aria-label="更多"
          @click="emit('action', 'more')"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            aria-hidden="true"
          >
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="listEl" class="yz-chat-composer__messages" role="log" aria-live="polite">
      <!-- 用户气泡（beautifului: justify-end pl-14 + rounded-xl bg-field） -->
      <div
        v-for="(msg, i) in items"
        :key="i"
        class="yz-chat-composer__msg"
        :class="`yz-chat-composer__msg--${msg.role}`"
      >
        <template v-if="msg.role === 'user'">
          <div class="yz-chat-composer__bubble">{{ msg.text }}</div>
        </template>
        <!-- 助手行：名称 + 标签 + 耗时 + 正文（beautifului: fade-up 400ms） -->
        <template v-else>
          <div class="yz-chat-composer__assistant">
            <div class="yz-chat-composer__assistant-head">
              <span class="yz-chat-composer__assistant-label">{{ msg.label }}</span>
              <span v-if="msg.tag" class="yz-chat-composer__assistant-tag">{{ msg.tag }}</span>
              <span v-if="msg.duration" class="yz-chat-composer__assistant-duration">for {{ msg.duration }}</span>
            </div>
            <p class="yz-chat-composer__assistant-text">{{ msg.text }}</p>
          </div>
        </template>
      </div>
    </div>

    <!-- 输入区（beautifului: rounded-control border-line bg-field focus-within:border-line-strong） -->
    <div class="yz-chat-composer__composer">
      <div class="yz-chat-composer__box">
        <input
          :value="text"
          class="yz-chat-composer__input"
          :placeholder="placeholder"
          aria-label="Chat prompt"
          @input="onInput"
          @keydown.enter.exact.prevent="submit"
        />
        <div class="yz-chat-composer__send-row">
          <button
            type="button"
            class="yz-chat-composer__send"
            aria-label="发送"
            :disabled="!text.trim()"
            @click="submit"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 根容器（beautifului: h-[288px] w-full max-w-95 flex-col rounded-[14px] bg-surface shadow-card） */
.yz-chat-composer {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  align-self: flex-start;
  overflow: hidden;
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
}

/* 面板头（beautifului: flex shrink-0 justify-between border-b border-line p-1.5） */
.yz-chat-composer__head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-chat-composer__tabs {
  display: flex;
  align-items: center;
}

/* 标签页（beautifului: rounded-[6px] px-2 py-[3px] text-[13px] text-ink，激活 bg-field） */
.yz-chat-composer__tab {
  padding: 3px 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  color: var(--yz-ink);
  opacity: 0.5;
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), opacity 100ms var(--yz-ease-out-strong);
}
.yz-chat-composer__tab:hover {
  opacity: 0.75;
}
.yz-chat-composer__tab--active {
  background: var(--yz-field);
  opacity: 1;
}

/* 头部操作按钮（beautifului: size-6 rounded-[6px] text-ink-3 hover:bg-hover hover:text-ink-2；源 gap-1=4px） */
.yz-chat-composer__head-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.yz-chat-composer__head-btn {
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
.yz-chat-composer__head-btn:hover {
  background: var(--yz-hover);
  color: var(--yz-ink-2);
}

/* 消息区（beautifului: flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pt-2.5 pb-1） */
.yz-chat-composer__messages {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  padding: 10px 12px 4px;
}
.yz-chat-composer__msg {
  display: flex;
  width: 100%;
}

/* 用户消息（beautifului: justify-end pl-14，气泡 rounded-xl bg-field） */
.yz-chat-composer__msg--user {
  justify-content: flex-end;
  padding-left: 56px;
}
.yz-chat-composer__bubble {
  border-radius: 12px;
  background: var(--yz-field);
  padding: 6px 12px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--yz-ink);
  animation: yz-pop-in 300ms var(--yz-ease-out-strong) both;
}

/* 助手消息（beautifului: fade-up 400ms；头部 12px + 正文 13px） */
.yz-chat-composer__assistant {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  animation: yz-fade-in 400ms var(--yz-ease-out-strong) both;
}
.yz-chat-composer__assistant-head {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 1.3;
}
.yz-chat-composer__assistant-label {
  font-weight: 500;
  color: var(--yz-ink);
}
.yz-chat-composer__assistant-tag {
  color: var(--yz-ink-2);
}
.yz-chat-composer__assistant-duration {
  font-family: var(--yz-font-mono);
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink);
}
.yz-chat-composer__assistant-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--yz-ink);
}

/* 输入区容器（beautifului: mt-auto shrink-0 p-1.5） */
.yz-chat-composer__composer {
  flex-shrink: 0;
  margin-top: auto;
  padding: 6px;
}

/* 输入框（beautifului: rounded-control border-line bg-field p-2.5 focus-within:border-line-strong） */
.yz-chat-composer__box {
  display: flex;
  cursor: text;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--yz-line);
  border-radius: var(--yz-radius-control);
  background: var(--yz-field);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.035);
  transition: border-color 150ms var(--yz-ease-out-strong), box-shadow 150ms var(--yz-ease-out-strong);
}
.yz-chat-composer__box:focus-within {
  border-color: var(--yz-line-strong);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.025);
}

.yz-chat-composer__input {
  min-height: 18px;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 13px;
  line-height: 1.4;
  color: var(--yz-ink);
  outline: none;
}
.yz-chat-composer__input::placeholder {
  color: var(--yz-ink-3);
}

.yz-chat-composer__send-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 发送（beautifului: size-7 rounded-[8px]；空文本 line-strong + ink-2，有文本强调色） */
.yz-chat-composer__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: var(--yz-line-strong);
  color: var(--yz-ink-2);
  cursor: pointer;
  transition: background-color 200ms var(--yz-ease-out-strong), color 200ms var(--yz-ease-out-strong), transform 200ms var(--yz-ease-out-strong);
}
.yz-chat-composer__send:not(:disabled) {
  background: var(--yz-accent);
  color: #ffffff;
}
.yz-chat-composer__send:not(:disabled):active {
  transform: scale(0.96);
}
.yz-chat-composer__send:disabled {
  cursor: default;
}

/* 动效开关：关闭时停掉入场动画 */
@media (prefers-reduced-motion: reduce) {
  .yz-chat-composer__bubble,
  .yz-chat-composer__assistant {
    animation: none;
  }
}
</style>
