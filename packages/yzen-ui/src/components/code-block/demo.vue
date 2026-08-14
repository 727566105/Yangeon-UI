<script setup lang="ts">
import { computed } from 'vue'
import { YzCodeBlock } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { label: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <YzCodeBlock v-bind="active" />
</template>
