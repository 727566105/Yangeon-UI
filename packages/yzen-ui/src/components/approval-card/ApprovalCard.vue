<script setup lang="ts">
// YzApprovalCard — Approval Card 人工审批卡片（移植自 beautifului.dev Approval Card）
// AI 在行动前向人工确认：选项单选（批准态显示绿勾）/ 自定义回复 + 提交按钮状态切换
import { computed, ref, watch } from 'vue'
import { YzIcon } from '../../index'

export interface ApprovalOption {
  label: string
}

interface ApprovalCardProps {
  question?: string
  options?: ApprovalOption[]
  /** 审批状态：pending 待处理（中性） / approved 已批准（绿色勾选） */
  status?: 'pending' | 'approved'
  /** 选中的选项下标（受控，null = 未选） */
  selected?: number | null
  /** 自定义回复文本（受控） */
  custom?: string
  page?: number
  pageCount?: number
  placeholder?: string
}

const props = withDefaults(defineProps<ApprovalCardProps>(), {
  question: '今夜是否启动全夜极光观测？',
  options: () => [
    { label: '启动全夜观测（4 站联动）' },
    { label: '仅监测 kp-index 峰值时段' },
    { label: '推迟至明晚再观测' },
  ],
  status: 'pending',
  selected: null,
  custom: '',
  page: 0,
  pageCount: 3,
  placeholder: '输入自定义指令…',
})

const emit = defineEmits<{
  (e: 'update:selected', value: number | null): void
  (e: 'update:custom', value: string): void
  (e: 'update:page', value: number): void
  (e: 'submit', payload: { option: number | null; custom: string }): void
  (e: 'dismiss'): void
}>()

// 受控/非受控双模式：props 变化时同步内部状态
const innerSelected = ref<number | null>(props.selected)
watch(
  () => props.selected,
  (v) => (innerSelected.value = v),
)
const innerCustom = ref(props.custom)
watch(
  () => props.custom,
  (v) => (innerCustom.value = v),
)
const innerPage = ref(props.page)
watch(
  () => props.page,
  (v) => (innerPage.value = v),
)

const hasAnswer = computed(() => innerSelected.value !== null || innerCustom.value.trim() !== '')

function pickOption(i: number) {
  innerSelected.value = i
  innerCustom.value = ''
  emit('update:selected', i)
  emit('update:custom', '')
}

function onCustomInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  innerCustom.value = v
  // 输入自定义回复时取消选项选中（互斥）
  if (v.trim() !== '') {
    innerSelected.value = null
    emit('update:selected', null)
  }
  emit('update:custom', v)
}

function goPage(p: number) {
  innerPage.value = p
  emit('update:page', p)
}

function submit() {
  if (!hasAnswer.value) return
  emit('submit', { option: innerSelected.value, custom: innerCustom.value })
}

function dismiss() {
  emit('dismiss')
}
</script>

<template>
  <div class="yz-approval-card">
    <div class="yz-approval-card__card">
      <div class="yz-approval-card__pad">
        <div class="yz-approval-card__head">
          <span class="yz-approval-card__question">{{ question }}</span>
          <button
            type="button"
            class="yz-approval-card__dismiss"
            aria-label="Dismiss"
            @click="dismiss"
          >
            <YzIcon name="close" :size="14" :stroke-width="2.2" />
          </button>
        </div>

        <div class="yz-approval-card__options">
          <button
            v-for="(opt, i) in options"
            :key="i"
            type="button"
            class="yz-approval-card__option"
            :class="{ 'yz-approval-card__option--on': innerSelected === i }"
            :aria-pressed="innerSelected === i"
            @click="pickOption(i)"
          >
            <span
              class="yz-approval-card__radio"
              :class="{
                'yz-approval-card__radio--on': innerSelected === i,
                'yz-approval-card__radio--approved': status === 'approved' && innerSelected === i,
              }"
              aria-hidden="true"
            >
              <YzIcon
                v-if="status === 'approved' && innerSelected === i"
                name="check"
                :size="10"
                :stroke-width="3"
                class="yz-approval-card__radio-check"
              />
              <span
                v-else
                class="yz-approval-card__dot"
                :class="{ 'yz-approval-card__dot--on': innerSelected === i }"
              />
            </span>
            <span class="yz-approval-card__option-label">{{ opt.label }}</span>
          </button>

          <label class="yz-approval-card__custom">
            <span
              class="yz-approval-card__radio"
              :class="{ 'yz-approval-card__radio--on': innerCustom.trim() !== '' }"
              aria-hidden="true"
            >
              <span
                class="yz-approval-card__dot"
                :class="{ 'yz-approval-card__dot--on': innerCustom.trim() !== '' }"
              />
            </span>
            <input
              class="yz-approval-card__custom-input"
              :placeholder="placeholder"
              aria-label="Custom answer"
              :value="innerCustom"
              @input="onCustomInput"
            />
          </label>
        </div>
      </div>

      <div class="yz-approval-card__footer">
        <span class="yz-approval-card__nav">
          <button
            type="button"
            class="yz-approval-card__nav-btn"
            aria-label="Previous"
            :disabled="innerPage === 0"
            @click="goPage(innerPage - 1)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span class="yz-approval-card__dots">
            <button
              v-for="n in pageCount"
              :key="n"
              type="button"
              class="yz-approval-card__dot-btn"
              :class="{ 'yz-approval-card__dot-btn--on': innerPage === n - 1 }"
              :aria-label="`Go to question ${n}`"
              :aria-current="innerPage === n - 1 ? 'step' : undefined"
              @click="goPage(n - 1)"
            />
          </span>
          <button
            type="button"
            class="yz-approval-card__nav-btn"
            aria-label="Next"
            :disabled="innerPage >= pageCount - 1"
            @click="goPage(innerPage + 1)"
          >
            <YzIcon name="chevron-right" :size="14" :stroke-width="2.2" />
          </button>
        </span>

        <button
          type="button"
          class="yz-approval-card__submit"
          :class="{ 'yz-approval-card__submit--approved': status === 'approved' }"
          :aria-label="status === 'approved' ? 'Approved' : 'Next question'"
          :disabled="!hasAnswer"
          @click="submit"
        >
          <YzIcon
            v-if="status === 'approved'"
            name="check"
            :size="14"
            :stroke-width="2.5"
          />
          <svg
            v-else
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
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
</template>

<style scoped lang="scss">
/* 根容器（beautifului: w-full max-w-80 flex min-h-[196px] flex-col items-stretch） */
.yz-approval-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 320px;
  min-height: 196px;
}

/* 卡片（beautifului: rounded-card bg-surface shadow-card overflow-hidden） */
.yz-approval-card__card {
  overflow: hidden;
  border-radius: var(--yz-radius-card);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-card);
}

.yz-approval-card__pad {
  padding: 12px;
}

/* 头部：问题 + 驳回按钮（beautifului: flex items-start justify-between gap-3） */
.yz-approval-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.yz-approval-card__question {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  color: var(--yz-ink);
}
.yz-approval-card__dismiss {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.yz-approval-card__dismiss:hover {
  background: var(--yz-hover);
  color: var(--yz-ink);
}

/* 选项区（beautifului: mt-2 flex flex-col gap-0.5） */
.yz-approval-card__options {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 8px;
}

/* 选项行（beautifului: -mx-1.5 flex items-center gap-2 rounded-control px-1.5 py-1 text-left） */
.yz-approval-card__option,
.yz-approval-card__custom {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 -6px;
  padding: 4px 6px;
  border-radius: var(--yz-radius-control);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong);
}
.yz-approval-card__option {
  border: none;
  background: transparent;
  text-align: left;
  font: inherit;
}
.yz-approval-card__option:hover,
.yz-approval-card__custom:hover,
.yz-approval-card__custom:focus-within {
  background: var(--yz-hover);
}

/* 单选圈（beautifului: size-4 rounded-full shadow-[inset_0_0_0_1.5px_var(--line-strong)]） */
.yz-approval-card__radio {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 99px;
  box-shadow: inset 0 0 0 1.5px var(--yz-line-strong);
  color: #fff;
  transition: box-shadow 200ms var(--yz-ease-out-strong), background-color 200ms var(--yz-ease-out-strong);
}
.yz-approval-card__radio--on {
  box-shadow: inset 0 0 0 1.5px var(--yz-green);
}
.yz-approval-card__radio--approved {
  background: var(--yz-green);
  box-shadow: none;
  animation: yz-pop-in 300ms var(--yz-ease-out-strong) both;
}

/* 内部圆点（beautifului: size-1.5 rounded-full bg-canvas，scale 0→1） */
.yz-approval-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: var(--yz-canvas);
  transform: scale(0);
  transition: transform 200ms var(--yz-ease-out-strong), background-color 200ms var(--yz-ease-out-strong);
}
.yz-approval-card__dot--on {
  transform: scale(1);
  background: var(--yz-green);
}
.yz-approval-card__radio-check {
  animation: yz-pop-in 300ms var(--yz-ease-out-strong) both;
}

.yz-approval-card__option-label {
  min-width: 0;
  font-size: 13px;
  color: var(--yz-ink-2);
  transition: color 200ms var(--yz-ease-out-strong);
}
.yz-approval-card__option--on .yz-approval-card__option-label {
  color: var(--yz-ink);
}

/* 自定义回复行 */
.yz-approval-card__custom-input {
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 13px;
  color: var(--yz-ink);
}
.yz-approval-card__custom-input::placeholder {
  color: var(--yz-ink-3);
}

/* 底部栏（beautifului: flex items-center justify-between border-t border-line） */
.yz-approval-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-top: 1px solid var(--yz-line);
}
.yz-approval-card__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.yz-approval-card__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 5px;
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 100ms var(--yz-ease-out-strong), color 100ms var(--yz-ease-out-strong);
}
.yz-approval-card__nav-btn:enabled:hover {
  background: var(--yz-hover);
  color: var(--yz-ink-2);
}
.yz-approval-card__nav-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

/* 分页点（beautifului: rounded-full transition-all duration-300；源 gap-1=4px，评审 M1 修复） */
.yz-approval-card__dots {
  display: flex;
  align-items: center;
  gap: 4px;
}
.yz-approval-card__dot-btn {
  padding: 0;
  border: none;
  border-radius: 99px;
  background: transparent;
  cursor: pointer;
  width: 7px;
  height: 7px;
  border: 1.5px solid var(--yz-ink-3);
  transition: width 300ms var(--yz-ease-out-strong), height 300ms var(--yz-ease-out-strong),
    border-color 300ms var(--yz-ease-out-strong), border-width 300ms var(--yz-ease-out-strong);
}
.yz-approval-card__dot-btn--on {
  width: 9px;
  height: 9px;
  border: 2.5px solid var(--yz-ink);
}

/* 提交/批准按钮（beautifului: size-7 rounded-[8px] shadow-btn active:scale-[0.96]） */
.yz-approval-card__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: -2px;
  border: none;
  border-radius: 8px;
  background: var(--yz-field);
  color: var(--yz-ink-3);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  cursor: pointer;
  transition: background-color 200ms var(--yz-ease-out-strong), color 200ms var(--yz-ease-out-strong),
    transform 200ms var(--yz-ease-out-strong);
}
.yz-approval-card__submit:enabled:active {
  transform: scale(0.96);
}
.yz-approval-card__submit:disabled {
  opacity: 0.35;
  cursor: default;
}
.yz-approval-card__submit--approved {
  background: var(--yz-green);
  color: #fff;
}

/* 动效开关：关闭时停掉过渡与弹出动画 */
@media (prefers-reduced-motion: reduce) {
  .yz-approval-card__radio,
  .yz-approval-card__dot,
  .yz-approval-card__option-label,
  .yz-approval-card__dismiss,
  .yz-approval-card__nav-btn,
  .yz-approval-card__dot-btn,
  .yz-approval-card__submit {
    transition: none;
  }
  .yz-approval-card__radio--approved,
  .yz-approval-card__radio-check {
    animation: none;
  }
}
</style>
