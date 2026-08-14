<script setup lang="ts">
import { computed, ref } from 'vue'
import { YzInput } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { label: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
const value = ref('')
</script>

<template>
  <div style="width: 100%; max-width: 380px">
    <YzInput v-model="value" v-bind="active" />
  </div>
</template>
