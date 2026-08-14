<script setup lang="ts">
import { computed } from 'vue'
import { YzIcon, YzText } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { label: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px">
    <YzIcon v-bind="active" :size="24" />
    <YzText size="xs" mono type="secondary">icon / sparkles</YzText>
  </div>
</template>
