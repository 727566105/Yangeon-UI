<script setup lang="ts">
import { ref } from 'vue'
import { CATEGORY_LABELS } from '../registry'
import { useGroups } from '../groups'

defineProps<{ activeKey: string | null }>()
const groupByCategory = useGroups()

// 胶囊主题切换（beautifului 同款：滑块位移 + 双图标位）
const isDark = ref(document.documentElement.dataset.theme === 'dark')

function setTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem('yz-theme', dark ? 'dark' : 'light')
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__top">
      <div class="sidebar__brand-row">
        <span class="sidebar__logo">YZ</span>
        <div class="theme-switch" role="group" aria-label="主题切换">
          <span
            aria-hidden="true"
            class="theme-switch__thumb"
            :style="{ transform: `translateX(${isDark ? 32 : 0}px)` }"
          />
          <button
            type="button"
            class="theme-switch__item"
            :class="{ 'theme-switch__item--active': !isDark }"
            aria-label="浅色模式"
            @click="setTheme(false)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </button>
          <button
            type="button"
            class="theme-switch__item"
            :class="{ 'theme-switch__item--active': isDark }"
            aria-label="深色模式"
            @click="setTheme(true)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
        </div>
      </div>
      <h1 class="sidebar__title">Yzen-UI for AI-native interfaces.</h1>
    </div>

    <div class="sidebar__nav-wrap">
      <div class="sidebar__nav-scroll">
        <nav aria-label="Components">
          <div v-for="(entries, category) in groupByCategory" :key="category" class="sidebar__group">
            <p class="sidebar__group-label">{{ CATEGORY_LABELS[category] ?? category }}</p>
            <ul class="sidebar__list">
              <li v-for="e in entries" :key="e.key">
                <a
                  class="sidebar__link"
                  :class="{ 'sidebar__link--active': activeKey === e.key }"
                  :href="`#section-${e.key}`"
                >
                  <span class="sidebar__num">{{ String(e.order).padStart(2, '0') }}</span>
                  {{ e.name }}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>

    <div class="sidebar__footer">
      <div class="sidebar__card">
        <span class="sidebar__card-title">Yzen-UI</span>
        <span class="sidebar__card-sub">Build AI-native interfaces · 个人组件基座</span>
      </div>
      <a class="sidebar__btn" href="#" @click.prevent>
        v1.0 · MIT
      </a>
    </div>
  </aside>
</template>

<style scoped>
/* 结构对齐 beautifului.dev aside：flex-col + 桌面 sticky 全高 + 虚线右边框 */
.sidebar {
  display: flex;
  flex-direction: column;
  border-bottom: 1px dashed var(--yz-line);
  padding: 64px 28px 28px;
}
@media (min-width: 1024px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow: hidden;
    border-bottom: none;
    border-right: 1px dashed var(--yz-line);
    padding-top: clamp(2.5rem, 8vh, 5rem);
  }
}

.sidebar__top {
  flex-shrink: 0;
}

/* 品牌行：logo + 胶囊主题切换（beautifului: h-9 grid-cols-2 rounded-full bg-field p-0.5 + 滑块） */
.sidebar__brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--yz-accent);
  color: #fff;
  font-family: var(--yz-font-mono);
  font-weight: 600;
  font-size: 16px;
}
.theme-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, 32px);
  align-items: center;
  height: 36px;
  border-radius: 99px;
  background: var(--yz-field);
  padding: 2px;
}
.theme-switch__thumb {
  position: absolute;
  inset-block: 2px;
  left: 2px;
  width: 32px;
  border-radius: 99px;
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  transition: transform 200ms var(--yz-ease-out-strong);
}
.theme-switch__item {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 99px;
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: color 150ms var(--yz-ease-out-strong);
}
.theme-switch__item:hover { color: var(--yz-ink-2); }
.theme-switch__item--active { color: var(--yz-ink); }

/* 品牌标题（beautifului: 21px semibold tracking-[-0.02em] leading-snug） */
.sidebar__title {
  margin: 48px 0 0;
  font-size: 21px;
  line-height: 1.375;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--yz-ink);
  text-wrap: balance;
}
@media (min-width: 1024px) {
  .sidebar__title { margin-top: clamp(1.5rem, 5vh, 3rem); }
}

/* 导航区：虚线顶部分隔 + 内部滚动（隐藏滚动条 + 底部渐隐） */
.sidebar__nav-wrap {
  position: relative;
  margin-top: 28px;
  border-top: 1px dashed var(--yz-line);
  padding-top: 24px;
}
@media (min-width: 1024px) {
  .sidebar__nav-wrap {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding-top: 0;
  }
}
.sidebar__nav-scroll {
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-mask-image: linear-gradient(#000 0 calc(100% - 6rem), #0000 100%);
  mask-image: linear-gradient(#000 0 calc(100% - 6rem), #0000 100%);
}
.sidebar__nav-scroll::-webkit-scrollbar { display: none; }
@media (min-width: 1024px) {
  .sidebar__nav-scroll { height: 100%; padding-bottom: 64px; }
}

.sidebar__group + .sidebar__group { margin-top: 20px; }
.sidebar__group-label {
  margin: 0 0 8px;
  font-size: 11.5px;
  color: var(--yz-ink-3);
}
.sidebar__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sidebar__link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 7px;
  font-size: 13px;
  color: var(--yz-ink-2);
  text-decoration: none;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.sidebar__link:hover { background: var(--yz-hover); color: var(--yz-ink); }
.sidebar__link--active { background: var(--yz-hover); color: var(--yz-ink); }
.sidebar__num {
  font-family: var(--yz-font-mono);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--yz-ink-3);
}

/* 底部卡片（beautifului: 卡片 + 胶囊按钮 h-7 rounded-full bg-field） */
.sidebar__footer {
  flex-shrink: 0;
  margin-top: 24px;
}
.sidebar__card {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 8px;
}
.sidebar__card-title {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.25;
  color: var(--yz-ink);
}
.sidebar__card-sub {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.625;
  color: var(--yz-ink-2);
  text-wrap: pretty;
}
.sidebar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin-top: 10px;
  padding: 0 10px;
  border-radius: 99px;
  background: var(--yz-field);
  color: var(--yz-ink);
  font-size: 11.5px;
  font-weight: 500;
  text-decoration: none;
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  transition: background-color 150ms var(--yz-ease-out-strong), transform 150ms var(--yz-ease-out-strong);
}
.sidebar__btn:hover { background: var(--yz-hover); }
.sidebar__btn:active { transform: scale(0.96); }
</style>
