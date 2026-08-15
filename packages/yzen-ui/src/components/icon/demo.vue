<script setup lang="ts">
import { computed } from 'vue'
import { YzIcon, YzText } from '../../index'
import type { IconName } from './index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, any> }[]
}>()

// demo 壳是转发层，props 值类型无法静态收窄，用 any + 显式断言
const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px">
    <YzIcon
      :name="(active.name as IconName | undefined) ?? 'sparkles'"
      :size="(active.size as number | undefined) ?? 24"
    />
    <YzText size="xs" mono type="secondary">icon / sparkles</YzText>
  </div>
</template>
