<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from '../i18n'
import { buildVariantSegments, type DisplayVariant } from './buildVariantSegments'

// 样式 tab 栏：一个样式（分组）一个 tab，点击后联动下方按钮组显示该样式。
// 渲染在 surface 卡片外（上方），由 ComponentSection 摆放
const props = defineProps<{ variants: DisplayVariant[]; modelValue: number }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: number): void }>()
const { t } = useI18n()

const segments = computed(() => buildVariantSegments(props.variants))

// 激活段：由当前全局变体 index 反推（index 落在哪一段，哪段就是激活段）
const activeSeg = computed(() =>
  segments.value.findIndex((seg) => seg.items.some((it) => it.index === props.modelValue)),
)

// 记住每段最后选中的变体（全局 index）：切走再切回时恢复上次状态，而不是回到段首
const lastBySegment = ref<Record<number, number>>({})
watch(
  () => props.modelValue,
  (idx) => {
    const si = segments.value.findIndex((seg) => seg.items.some((it) => it.index === idx))
    if (si >= 0) lastBySegment.value[si] = idx
  },
  { immediate: true },
)

function select(si: number) {
  const seg = segments.value[si]
  if (!seg) return
  emit('update:modelValue', lastBySegment.value[si] ?? seg.items[0].index)
}
</script>

<template>
  <div class="variant-tabs" role="tablist" :aria-label="t('switcher.aria')">
    <button
      v-for="(seg, si) in segments"
      :key="si"
      type="button"
      class="variant-tabs__tab"
      :class="{ 'variant-tabs__tab--active': activeSeg === si }"
      :aria-selected="activeSeg === si"
      @click="select(si)"
    >{{ seg.group }}</button>
  </div>
</template>

<style scoped>
/* 与 VariantSwitcher 胶囊同款：rounded-full bg-field p-0.5，激活项 bg-surface + shadow */
.variant-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 99px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.variant-tabs__tab {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-2);
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong), box-shadow 150ms var(--yz-ease-out-strong);
}
.variant-tabs__tab:hover { color: var(--yz-ink); }
.variant-tabs__tab--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
}
</style>
