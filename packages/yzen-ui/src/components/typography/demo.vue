<script setup lang="ts">
import { computed } from 'vue'
import { YzText, YzTitle } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start">
    <YzTitle :level="2">极光实验室 · 观测控制台</YzTitle>
    <YzText v-bind="active">追踪 12 条实时数据流，正在等待下一次粒子风暴窗口。</YzText>
    <YzText size="xs" mono type="tertiary">aurora.lab / session 0x7f3a · uptime 03:42:11</YzText>
  </div>
</template>
