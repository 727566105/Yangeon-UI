<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { YzTabs, type TabItem } from '../../index'

const props = defineProps<{
  variantIndex?: number
  variants?: { id: string; props: Record<string, unknown> }[]
}>()

const active = computed(() => props.variants?.[props.variantIndex ?? 0]?.props ?? {})

// 可编辑卡片（editable-card）为受控模式：items/activeKey 在这里维护，
// 变体首次切入时从 registry props 初始化，之后由 + / × 交互驱动
const editableItems = ref<TabItem[]>([])
const editableKey = ref('')
const newIndex = ref(0)

watch(
  () => active.value.type,
  (type) => {
    if (type === 'editable-card' && Array.isArray(active.value.items)) {
      editableItems.value = JSON.parse(JSON.stringify(active.value.items)) as TabItem[]
      editableKey.value = editableItems.value[0]?.key ?? ''
      newIndex.value = 0
    }
  },
  { immediate: true },
)

function addTab() {
  const key = `newTab${newIndex.value++}`
  editableItems.value = [
    ...editableItems.value,
    { key, label: 'New Tab', content: 'Content of new Tab' },
  ]
  editableKey.value = key
}

function removeTab(key: string) {
  const idx = editableItems.value.findIndex((t) => t.key === key)
  if (idx < 0 || editableItems.value.length <= 1) return // 至少保留一个
  const next = editableItems.value.filter((t) => t.key !== key)
  if (key === editableKey.value) {
    editableKey.value = next[Math.min(idx, next.length - 1)].key
  }
  editableItems.value = next
}
</script>

<template>
  <YzTabs
    v-if="active.type === 'editable-card'"
    v-bind="active"
    v-model:active-key="editableKey"
    :items="editableItems"
    @add="addTab"
    @remove="removeTab"
  />
  <YzTabs v-else v-bind="active" />
</template>
