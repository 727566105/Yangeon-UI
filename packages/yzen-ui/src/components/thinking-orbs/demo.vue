<script setup lang="ts">
import { computed } from 'vue'
import { YzThinkingOrbs } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})
</script>

<template>
  <!-- 思考光球：Canvas 点阵动画，九种状态由 variants 切换；附 20px 行内小尺寸对照 -->
  <div class="orb-demo">
    <YzThinkingOrbs v-bind="active" />
    <YzThinkingOrbs v-bind="active" :size="20" />
  </div>
</template>

<style scoped>
.orb-demo {
  display: flex;
  align-items: center;
  gap: 24px;
}
</style>
