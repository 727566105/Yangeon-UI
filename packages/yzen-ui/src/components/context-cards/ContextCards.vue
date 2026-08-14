<script setup lang="ts">
// YzContextCards — Context Cards 上下文卡片（移植自 beautifului.dev Context Cards）
// 检索知识分块列表：标题/字符数栏 + 正文 + 来源附件胶囊（PDF/CSV 徽章 + 外链图标）

export interface ContextChunk {
  /** 分块标题（卡片栏左） */
  title: string
  /** 字符数（等宽，卡片栏右） */
  characters: string
  /** 正文 */
  body: string
  /** 来源附件（渲染为可点击胶囊） */
  attachment?: {
    /** 徽章文字，如 PDF / CSV */
    tag: string
    /** 徽章底色（beautifului: bg-red / bg-green） */
    tone?: 'red' | 'green' | 'accent' | 'orange'
    /** 文件名 */
    filename: string
  }
}

interface ContextCardsProps {
  /** “All chunks” 计数徽章（tabular-nums） */
  count?: number
  /** 分块列表 */
  chunks?: ContextChunk[]
  /** 入场动效（头部淡入 + 卡片上浮 + 附件胶囊 pop-in 错峰） */
  animated?: boolean
}

const props = withDefaults(defineProps<ContextCardsProps>(), {
  count: 32,
  chunks: () => [
    {
      title: 'Vendor onboarding rule',
      characters: '290 characters',
      body: 'Cold-chain certification must be verified before a new dairy can be added to the reorder workflow.',
      attachment: {
        tag: 'PDF',
        tone: 'red' as const,
        filename: 'Dairy Onboarding SOP.pdf',
      },
    },
    {
      title: 'Seasonal demand row',
      characters: '1,250 characters',
      body: 'Q4 velocity table: pistachio +18%, vanilla +6%, rocky road -11%; retire flavors below 40 scoops weekly.',
      attachment: {
        tag: 'CSV',
        tone: 'green' as const,
        filename: 'Sales Velocity Export.csv',
      },
    },
  ],
  animated: true,
})

const emit = defineEmits<{
  /** 点击来源附件 */
  (e: 'attachment', payload: { index: number; chunk: ContextChunk }): void
}>()

function onAttachment(i: number) {
  const chunk = props.chunks[i]
  if (!chunk?.attachment) return
  emit('attachment', { index: i, chunk })
}
</script>

<template>
  <div class="yz-context-cards">
    <!-- 头部：All chunks + 计数徽章（beautifului: px-0.5 fade-in 400ms） -->
    <div class="yz-context-cards__head">
      <span class="yz-context-cards__label">All chunks</span>
      <span class="yz-context-cards__count">{{ count }}</span>
    </div>

    <!-- 分块卡片（beautifului: fade-up 400ms，0/100ms 错峰） -->
    <div
      v-for="(chunk, i) in chunks"
      :key="i"
      class="yz-context-cards__card"
      :class="{ 'yz-context-cards__card--animated': animated }"
      :style="animated ? { animationDelay: `${i * 100}ms` } : undefined"
    >
      <!-- 卡片栏：标题 + 字符数（beautifului: primitive-card-bar 10px 12px） -->
      <div class="yz-context-cards__bar">
        <span class="yz-context-cards__bar-title">
          <svg
            class="yz-context-cards__bar-icon"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          <span class="yz-context-cards__bar-name">{{ chunk.title }}</span>
        </span>
        <span class="yz-context-cards__bar-chars">{{ chunk.characters }}</span>
      </div>

      <!-- 正文（beautifului: px-3 pt-2 pb-1 12.5px leading-relaxed） -->
      <p class="yz-context-cards__body">{{ chunk.body }}</p>

      <!-- 来源附件胶囊（beautifului: h-6 rounded-full bg-inset px-2 shadow-btn；pop-in 0/80ms 错峰） -->
      <div v-if="chunk.attachment" class="yz-context-cards__attachments">
        <button
          type="button"
          class="yz-context-cards__pill"
          :class="{ 'yz-context-cards__pill--animated': animated }"
          :style="animated ? { animationDelay: `${i * 80}ms` } : undefined"
          @click="onAttachment(i)"
        >
          <span
            class="yz-context-cards__pill-tag"
            :class="`yz-context-cards__pill-tag--${chunk.attachment.tone ?? 'red'}`"
          >{{ chunk.attachment.tag }}</span>
          <span class="yz-context-cards__pill-name">{{ chunk.attachment.filename }}</span>
          <svg
            class="yz-context-cards__pill-icon"
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M7 17L17 7M7 7h10v10" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 根容器（beautifului: flex w-full max-w-95 flex-col gap-2，圆角窗口内自居中） */
.yz-context-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 380px;
}

/* 头部（beautifului: flex items-center gap-2 px-0.5，fade-in 400ms ease-out） */
.yz-context-cards__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 2px;
  animation: yz-fade-in 400ms ease-out both;
}
.yz-context-cards__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--yz-ink);
}
/* 计数徽章（beautifului: h-5 rounded-md bg-inset px-1.5 shadow-hairline tabular-nums） */
.yz-context-cards__count {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--yz-inset);
  box-shadow: 0 0 0 1px var(--yz-line);
  font-size: 11.5px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-2);
}

/* 分块卡片（beautifului: overflow-hidden rounded-card bg-surface shadow-card） */
.yz-context-cards__card {
  overflow: hidden;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
}
.yz-context-cards__card--animated {
  animation: yz-fade-up 400ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

/* 卡片栏（beautifului: primitive-card-bar → padding 10px 12px，flex gap-2.5 border-b） */
.yz-context-cards__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--yz-line);
}
.yz-context-cards__bar-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--yz-ink);
}
.yz-context-cards__bar-icon {
  flex-shrink: 0;
  color: var(--yz-ink);
}
.yz-context-cards__bar-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.yz-context-cards__bar-chars {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* 正文（beautifului: px-3 pt-2 pb-1 12.5px leading-relaxed） */
.yz-context-cards__body {
  margin: 0;
  padding: 8px 12px 4px;
  font-size: 12.5px;
  line-height: 1.625;
  color: var(--yz-ink-2);
}

/* 附件区（beautifului: px-3 pb-3） */
.yz-context-cards__attachments {
  padding: 0 12px 12px;
}

/* 附件胶囊（beautifului: h-6 rounded-full bg-inset px-2 text-[12px] shadow-btn hover:bg-hover；
   入场 pop-in：opacity 0 + scale(0.95) → 1，300ms，0/80ms 错峰） */
.yz-context-cards__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  padding: 0 8px;
  border: none;
  border-radius: 99px;
  background: var(--yz-inset);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-2);
  cursor: pointer;
  transition: background-color 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.yz-context-cards__pill:hover {
  background: var(--yz-hover);
}
.yz-context-cards__pill--animated {
  animation: yz-pop-in 300ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

/* 徽章（beautifului: size-3.5 rounded-[4px] text-[7px] font-bold text-white） */
.yz-context-cards__pill-tag {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  font-size: 7px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.yz-context-cards__pill-tag--red {
  background: var(--yz-red);
}
.yz-context-cards__pill-tag--green {
  background: var(--yz-green);
}
.yz-context-cards__pill-tag--accent {
  background: var(--yz-accent);
}
.yz-context-cards__pill-tag--orange {
  background: var(--yz-orange);
}
.yz-context-cards__pill-name {
  white-space: nowrap;
}
.yz-context-cards__pill-icon {
  flex-shrink: 0;
  color: var(--yz-ink-3);
}

/* 动效开关：关闭时停掉入场动画 */
@media (prefers-reduced-motion: reduce) {
  .yz-context-cards__head {
    animation: none;
  }
  .yz-context-cards__card--animated,
  .yz-context-cards__pill--animated {
    animation: none;
  }
}
</style>
