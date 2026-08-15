<script setup lang="ts">
// YzBreadcrumb — Breadcrumb 面包屑（antd Breadcrumb 移植为 Vue 3 + Yzen 规范）
// 层级导航：items（title/href）驱动，自定义分隔符，maxCount 超出时中间折叠为省略号。
import { computed } from 'vue'

export interface BreadcrumbItem {
  /** 显示文本（调用方传入 localized 后的文案） */
  title: string
  /** 可选链接；缺省渲染为纯文本 */
  href?: string
}

interface BreadcrumbProps {
  /** 面包屑层级（顺序即展示顺序） */
  items?: BreadcrumbItem[]
  /** 分隔符文本，默认 '/' */
  separator?: string
  /** 最多展示项数：超出时折叠中间（保留首项 + 末 (maxCount-2) 项） */
  maxCount?: number
  /** 视觉样式：a = 默认（灰链 + '/'），b = 强调（accent 链接 + 末项高亮） */
  style?: 'a' | 'b'
}

const props = withDefaults(defineProps<BreadcrumbProps>(), {
  items: () => [],
  separator: '/',
  style: 'a',
})

// 折叠计算：items 超长时输出 [首项, 省略项, 末尾项...]
const visible = computed<Array<{ key: string; item: BreadcrumbItem; ellipsis?: boolean }>>(() => {
  const list = props.items
  const max = props.maxCount
  if (!max || list.length <= max) {
    return list.map((item, i) => ({ key: `${i}`, item }))
  }
  const tail = Math.max(0, max - 2)
  const head = list.slice(0, 1)
  const last = list.slice(list.length - tail)
  return [
    { key: '0', item: head[0] },
    { key: 'ellipsis', item: { title: '…' }, ellipsis: true },
    ...last.map((item, i) => ({ key: `tail-${i}`, item })),
  ]
})
</script>

<template>
  <nav
    class="yz-breadcrumb"
    :class="`yz-breadcrumb--${props.style}`"
    aria-label="Breadcrumb"
  >
    <template v-for="(node, i) in visible" :key="node.key">
      <span
        v-if="node.ellipsis"
        class="yz-breadcrumb__ellipsis"
        aria-hidden="true"
      >…<span class="yz-breadcrumb__sep">{{ props.separator }}</span></span>
      <template v-else>
        <span class="yz-breadcrumb__item">
          <a
            v-if="node.item.href"
            class="yz-breadcrumb__link"
            :href="node.item.href"
          >{{ node.item.title }}</a>
          <span
            v-else
            class="yz-breadcrumb__text"
            :class="{ 'yz-breadcrumb__text--last': i === visible.length - 1 }"
          >{{ node.item.title }}</span>
        </span>
        <span
          v-if="i < visible.length - 1"
          class="yz-breadcrumb__sep"
          aria-hidden="true"
        >{{ props.separator }}</span>
      </template>
    </template>
  </nav>
</template>

<style scoped>
.yz-breadcrumb {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  font-family: var(--yz-font-sans);
  font-size: 13px;
  line-height: 1.4;
}
.yz-breadcrumb__item {
  display: inline-flex;
  align-items: center;
}
.yz-breadcrumb__text {
  color: var(--yz-ink-2);
}
.yz-breadcrumb__text--last {
  color: var(--yz-ink);
  font-weight: var(--yz-font-weight-medium);
}
.yz-breadcrumb__link {
  color: var(--yz-ink-3);
  text-decoration: none;
  border-radius: 4px;
  transition: color 150ms var(--yz-ease-out-strong);
}
.yz-breadcrumb__link:hover {
  color: var(--yz-accent);
}
.yz-breadcrumb__sep {
  margin: 0 6px;
  font-size: 12px;
  color: var(--yz-ink-3);
  user-select: none;
}
.yz-breadcrumb__ellipsis {
  margin: 0 2px;
  color: var(--yz-ink-3);
  letter-spacing: 1px;
}

/* 样式 B（强调）：链接 accent 色 + 末项高亮，配合 › 分隔符使用 */
.yz-breadcrumb--b .yz-breadcrumb__link {
  color: var(--yz-accent);
  font-weight: var(--yz-font-weight-medium);
}
.yz-breadcrumb--b .yz-breadcrumb__link:hover {
  color: var(--yz-accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.yz-breadcrumb--b .yz-breadcrumb__text--last {
  color: var(--yz-accent);
}
.yz-breadcrumb--b .yz-breadcrumb__sep {
  color: var(--yz-ink-3);
}
</style>
