<script setup lang="ts">
import { ref } from 'vue'
import { useGroups } from '../groups'
import { categoryMap } from '../categories'
import { useI18n } from '../i18n'
import type { Platform, RegistryEntry } from '@yzen-ui/shared'

const props = defineProps<{
  activeKey: string | null
  platforms: Platform[]
  activePlatform: string
  entries: RegistryEntry[]
}>()
defineEmits<{ (e: 'select-platform', key: string): void }>()
const groupByCategory = useGroups(() => props.entries)
const { t, locale, setLocale, localized } = useI18n()

// 胶囊主题切换（beautifului 同款：滑块位移 + 双图标位）
const isDark = ref(document.documentElement.dataset.theme === 'dark')

function setTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem('yz-theme', dark ? 'dark' : 'light')
}

// 导航锚点点击：目标 hash 与当前 URL hash 相同时（用户滑到底部再点当前区块），
// 浏览器不会触发滚动（hash 未变化），需手动 scrollIntoView 平滑回到区块顶部。
function onNavClick(event: MouseEvent, key: string) {
  if (window.location.hash !== `#section-${key}`) return
  event.preventDefault()
  document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__top">
      <div class="sidebar__brand-row">
        <span class="sidebar__logo">YZ</span>
        <div class="sidebar__switches">
          <!-- 语言切换（中/EN，与 theme-switch 同款胶囊 + 滑块位移） -->
          <div class="lang-switch" role="group" :aria-label="t('sidebar.language')">
            <span
              aria-hidden="true"
              class="lang-switch__thumb"
              :style="{ transform: `translateX(${locale === 'en' ? 32 : 0}px)` }"
            />
            <button
              type="button"
              class="lang-switch__item"
              :class="{ 'lang-switch__item--active': locale === 'zh' }"
              :aria-label="t('sidebar.zh')"
              :aria-pressed="locale === 'zh'"
              @click="setLocale('zh')"
            >{{ t('sidebar.zh') }}</button>
            <button
              type="button"
              class="lang-switch__item"
              :class="{ 'lang-switch__item--active': locale === 'en' }"
              :aria-label="t('sidebar.en')"
              :aria-pressed="locale === 'en'"
              @click="setLocale('en')"
            >{{ t('sidebar.en') }}</button>
          </div>
          <div class="theme-switch" role="group" :aria-label="t('sidebar.themeToggle')">
            <span
              aria-hidden="true"
              class="theme-switch__thumb"
              :style="{ transform: `translateX(${isDark ? 32 : 0}px)` }"
            />
            <button
              type="button"
              class="theme-switch__item"
              :class="{ 'theme-switch__item--active': !isDark }"
              :aria-label="t('sidebar.light')"
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
              :aria-label="t('sidebar.dark')"
              @click="setTheme(true)"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <h1 class="sidebar__title">{{ t('sidebar.brand') }}</h1>

      <!-- 平台（端）切换：动态端数胶囊（激活项浮起，VariantSwitcher 模式） -->
      <div class="platform-switch" role="group" :aria-label="t('sidebar.platformAria')">
        <button
          v-for="p in platforms"
          :key="p.key"
          type="button"
          class="platform-switch__item"
          :class="{ 'platform-switch__item--active': activePlatform === p.key }"
          :aria-pressed="activePlatform === p.key"
          @click="$emit('select-platform', p.key)"
        >{{ localized(p.label) }}</button>
      </div>
    </div>

    <div class="sidebar__nav-wrap">
      <div class="sidebar__nav-scroll">
        <nav :aria-label="t('sidebar.navAria')">
          <div v-for="(entries, category) in groupByCategory" :key="category" class="sidebar__group">
            <p class="sidebar__group-label">{{ localized(categoryMap[category]?.label) || category }}</p>
            <ul class="sidebar__list">
              <li v-for="e in entries" :key="e.key">
                <a
                  class="sidebar__link"
                  :class="{ 'sidebar__link--active': activeKey === e.key }"
                  :href="`#section-${e.key}`"
                  @click="onNavClick($event, e.key)"
                >
                  <span class="sidebar__num">{{ String(e.order).padStart(2, '0') }}</span>
                  {{ localized(e.name) }}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </div>

    <div class="sidebar__footer">
      <div class="sidebar__card">
        <span class="sidebar__card-title">{{ t('sidebar.cardTitle') }}</span>
        <span class="sidebar__card-sub">{{ t('sidebar.cardSub') }}</span>
      </div>
      <a class="sidebar__btn" href="#" @click.prevent>
        {{ t('sidebar.version') }}
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
.sidebar__switches {
  display: flex;
  align-items: center;
  gap: 6px;
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
/* 语言切换胶囊（与 theme-switch 同款：两列 32px 单元格 + 滑块位移） */
.lang-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, 32px);
  align-items: center;
  height: 36px;
  border-radius: 99px;
  background: var(--yz-field);
  padding: 2px;
}
.lang-switch__thumb {
  position: absolute;
  inset-block: 2px;
  left: 2px;
  width: 32px;
  border-radius: 99px;
  background: var(--yz-surface);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
  transition: transform 200ms var(--yz-ease-out-strong);
}
.lang-switch__item {
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
  font-family: var(--yz-font-mono);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: color 150ms var(--yz-ease-out-strong);
}
.lang-switch__item:hover { color: var(--yz-ink-2); }
.lang-switch__item--active { color: var(--yz-ink); }
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

/* 平台（端）切换胶囊：动态端数，激活项浮起（同 VariantSwitcher 模式） */
.platform-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 16px;
  padding: 2px;
  border-radius: 99px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.platform-switch__item {
  border: none;
  background: transparent;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.platform-switch__item:hover { color: var(--yz-ink); }
.platform-switch__item--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
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
/* 激活项：白底浮起 + 字重 + 内部左缘渐变指示条（对齐 console 导航激活风格，对比更明显） */
.sidebar__link--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-weight: 500;
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
}
.sidebar__link--active:hover {
  background: var(--yz-surface); /* hover 特异性更高会覆盖 active 背景，显式保持浮起 */
}
/* 指示条内嵌于激活项左缘（不外伸，避免「被切一刀」的割裂感），渐变淡出如能量条 */
.sidebar__link--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 15px;
  border-radius: 3px;
  background: linear-gradient(
    180deg,
    var(--yz-accent),
    color-mix(in srgb, var(--yz-accent) 25%, transparent)
  );
}
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
