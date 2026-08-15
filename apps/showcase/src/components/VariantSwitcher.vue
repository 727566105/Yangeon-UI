<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../i18n'
import { buildVariantSegments, type DisplayVariant } from './buildVariantSegments'

const props = defineProps<{ variants: DisplayVariant[]; modelValue: number }>()
defineEmits<{ (e: 'update:modelValue', v: number): void }>()
const { t } = useI18n()

const segments = computed(() => buildVariantSegments(props.variants))

// 多段（多样式）时由 VariantTabs 负责样式选择，这里只渲染激活段的一组按钮，
// 组标题也随之移出（标题已在 tab 栏）；单段保持原样（含左侧标题）
const visible = computed(() => {
  const segs = segments.value
  if (segs.length <= 1) return segs
  const active = segs.findIndex((seg) => seg.items.some((it) => it.index === props.modelValue))
  return active >= 0 ? [segs[active]] : segs
})
</script>

<template>
  <div class="variant-switcher" role="tablist" :aria-label="t('switcher.aria')">
    <div v-for="(seg, si) in visible" :key="si" class="variant-switcher__segment">
      <span v-if="seg.group && segments.length <= 1" class="variant-switcher__group">{{ seg.group }}</span>
      <div class="variant-switcher__pills">
        <button
          v-for="item in seg.items"
          :key="item.index"
          type="button"
          class="variant-switcher__item"
          :class="{ 'variant-switcher__item--active': modelValue === item.index }"
          @click="$emit('update:modelValue', item.index)"
        >
          {{ item.v.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 分组布局：每组 = 左侧标题（框外）+ 胶囊按钮组；多组横向排布，窄屏自动换行 */
.variant-switcher {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 14px;
}
.variant-switcher__segment {
  display: flex;
  align-items: center;
  gap: 8px;
}
/* 分组标题：胶囊外的独立小字标签（nowrap 防止被 flex 压缩成竖排） */
.variant-switcher__group {
  font-size: 10.5px;
  font-weight: 500;
  color: var(--yz-ink-3);
  white-space: nowrap;
  user-select: none;
}
/* 按钮胶囊：对齐 beautifului —— rounded-full bg-field p-0.5，激活项 bg-surface + shadow */
.variant-switcher__pills {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 99px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.variant-switcher__item {
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
.variant-switcher__item:hover { color: var(--yz-ink); }
.variant-switcher__item--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
}
</style>
