<script setup lang="ts">
import { computed } from 'vue'
import { YzDiffTable } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <YzDiffTable v-bind="active" />
</template>
