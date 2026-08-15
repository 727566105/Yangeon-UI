<script setup lang="ts">
import { computed } from 'vue'
import { YzContainer, YzRow, YzCol, YzCard, YzText } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <div style="width: 100%">
    <YzRow v-bind="active">
      <YzCol :span="8"><YzCard><YzText type="secondary">sensor-a</YzText></YzCard></YzCol>
      <YzCol :span="8"><YzCard><YzText type="secondary">sensor-b</YzText></YzCard></YzCol>
      <YzCol :span="8"><YzCard><YzText type="secondary">sensor-c</YzText></YzCard></YzCol>
      <YzCol :span="12"><YzCard><YzText type="secondary">uplink</YzText></YzCard></YzCol>
      <YzCol :span="12"><YzCard><YzText type="secondary">downlink</YzText></YzCard></YzCol>
    </YzRow>
  </div>
</template>
