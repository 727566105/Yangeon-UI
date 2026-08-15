<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import type { Component } from 'vue'
import { demoLoaders, demoGlobKey } from './demos'

// 预览容器（PRD 9.3「收录即所见」）：渲染组件库 demo 壳（构建期 glob + 异步加载）。
// 必须用 defineAsyncComponent 包装 loader——直接传 loader 函数会被 Vue 当函数式组件调用，
// 返回的 Promise 会被字符串化渲染成 [object Promise]（实测缺陷）。
// 变体 label 由父级按当前语言计算后传入，本组件不依赖任何应用的 i18n。
const demos = Object.fromEntries(
  Object.entries(demoLoaders).map(([path, loader]) => [
    path,
    defineAsyncComponent(loader as unknown as () => Promise<Component>),
  ]),
)

const props = defineProps<{
  entryKey: string
  variantIndex: number
  variants: { id: string; props: Record<string, unknown> }[]
}>()

const currentDemo = computed(() => demos[demoGlobKey(props.entryKey)])
</script>

<template>
  <component :is="currentDemo" :variant-index="variantIndex" :variants="variants" />
</template>
