<script setup lang="ts">
// YzShimmer demo：扫光文案变体（Generating response… / Searching… / Writing…）
import { computed } from 'vue'
import { YzShimmer } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <div class="sh-demo">
    <YzShimmer v-bind="active" />
  </div>
</template>

<style scoped>
.sh-demo {
  display: flex;
  justify-content: center;
}
</style>
