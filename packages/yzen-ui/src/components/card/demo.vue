<script setup lang="ts">
import { computed } from 'vue'
import { YzCard, YzText, YzTitle } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { label: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <div style="width: 100%; max-width: 320px">
    <YzCard v-bind="active">
      <template #header><YzTitle :level="3">极光观测任务 #42</YzTitle></template>
      <YzText type="secondary">数据流通道已建立，等待下一次粒子风暴窗口……</YzText>
      <template #footer>
        <YzText size="xs" mono type="tertiary">status: syncing · aurora-3.2.1</YzText>
      </template>
    </YzCard>
  </div>
</template>
