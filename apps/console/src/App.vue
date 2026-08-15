<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import ComponentList from './views/ComponentList.vue'
import ComponentEdit from './views/ComponentEdit.vue'
import ImportWizard from './views/ImportWizard.vue'
import Categories from './views/Categories.vue'
import Platforms from './views/Platforms.vue'
import Login from './views/Login.vue'
import { fetchRegistry, fetchCategories, fetchPlatforms, getToken, setToken, logout, AuthError } from './api'
import { useI18n } from './i18n'
import type { Platform, RegistryCategory, RegistryEntry } from '@yzen-ui/shared'

const { t, locale, setLocale } = useI18n()

type View = 'list' | 'edit' | 'import' | 'categories' | 'platforms'
const view = ref<View>('list')
const editingKey = ref<string | null>(null)
const entries = ref<RegistryEntry[]>([])
const categories = ref<RegistryCategory[]>([])
const platforms = ref<Platform[]>([])
const loadError = ref('')

// 登录态：本地 token 存在视为已登录（API 401 时自动回落登录页）
const authenticated = ref(!!getToken())

async function load() {
  try {
    const [reg, cats, plats] = await Promise.all([fetchRegistry(), fetchCategories(), fetchPlatforms()])
    entries.value = reg
    categories.value = cats
    platforms.value = plats
    loadError.value = ''
  } catch (e) {
    if (e instanceof AuthError) {
      authenticated.value = false
      return
    }
    loadError.value = e instanceof Error ? e.message : String(e)
  }
}
onMounted(() => {
  if (authenticated.value) load()
})

// 视图切换时刷新数据（分类/端/组件可能在别的视图被修改；categories/platforms 供下拉数据驱动）
watch(view, (v) => {
  if (v !== 'categories' && v !== 'platforms' && authenticated.value) load()
})

function onLoggedIn() {
  authenticated.value = true
  load()
}

async function onLogout() {
  await logout()
  authenticated.value = false
  view.value = 'list'
}

function openEdit(key: string) {
  editingKey.value = key
  view.value = 'edit'
}

function goImport() {
  view.value = 'import'
}

function goCategories() {
  view.value = 'categories'
  load()
}

function goPlatforms() {
  view.value = 'platforms'
  load()
}

// 主题切换（与 showcase 同款：data-theme + yz-theme 持久化）
const isDark = ref(document.documentElement.dataset.theme === 'dark')
function setTheme(dark: boolean) {
  isDark.value = dark
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem('yz-theme', dark ? 'dark' : 'light')
}
</script>

<template>
  <Login v-if="!authenticated" @logged-in="onLoggedIn" />

  <div v-else class="console">
    <header class="console__bar">
      <div class="console__brand">
        <span class="console__logo">YZ</span>
        <span class="console__title">{{ t('app.title') }}</span>
      </div>
      <nav class="console__nav" aria-label="nav">
        <button
          type="button"
          class="console__nav-item"
          :class="{ 'console__nav-item--active': view === 'list' || view === 'edit' }"
          @click="view = 'list'"
        >{{ t('nav.list') }}</button>
        <button
          type="button"
          class="console__nav-item"
          :class="{ 'console__nav-item--active': view === 'categories' }"
          @click="goCategories"
        >{{ t('nav.categories') }}</button>
        <button
          type="button"
          class="console__nav-item"
          :class="{ 'console__nav-item--active': view === 'platforms' }"
          @click="goPlatforms"
        >{{ t('nav.platforms') }}</button>
        <button
          type="button"
          class="console__nav-item"
          :class="{ 'console__nav-item--active': view === 'import' }"
          @click="goImport"
        >{{ t('nav.import') }}</button>
      </nav>
      <div class="console__controls">
        <div class="lang-switch" role="group" :aria-label="t('lang.aria')">
          <button
            type="button"
            class="lang-switch__item"
            :class="{ 'lang-switch__item--active': locale === 'zh' }"
            @click="setLocale('zh')"
          >中</button>
          <button
            type="button"
            class="lang-switch__item"
            :class="{ 'lang-switch__item--active': locale === 'en' }"
            @click="setLocale('en')"
          >EN</button>
        </div>
        <div class="theme-switch" role="group" :aria-label="t('theme.aria')">
          <button
            type="button"
            class="theme-switch__item"
            :class="{ 'theme-switch__item--active': !isDark }"
            :aria-label="t('theme.light')"
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
            :aria-label="t('theme.dark')"
            @click="setTheme(true)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          </button>
        </div>
        <button type="button" class="console__logout" @click="onLogout">{{ t('nav.logout') }}</button>
      </div>
    </header>

    <p v-if="loadError" class="console__error">{{ t('common.error') }}: {{ loadError }}</p>

    <main class="console__main">
      <ComponentList
        v-if="view === 'list'"
        :entries="entries"
        :categories="categories"
        :platforms="platforms"
        @edit="openEdit"
        @import="goImport"
        @order-saved="load"
      />
      <ComponentEdit
        v-else-if="view === 'edit' && editingKey"
        :key="editingKey"
        :entry="entries.find((e) => e.key === editingKey)"
        :entry-key="editingKey"
        :categories="categories"
        :platforms="platforms"
        @back="view = 'list'"
        @saved="view = 'list'"
      />
      <Categories v-else-if="view === 'categories'" />
      <Platforms v-else-if="view === 'platforms'" />
      <ImportWizard v-else-if="view === 'import'" @done="view = 'list'" />
    </main>
  </div>
</template>

<style scoped>
.console {
  min-height: 100vh;
  background: var(--yz-page);
  color: var(--yz-ink);
  font-family: var(--yz-font-sans);
}
.console__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 28px;
  border-bottom: 1px dashed var(--yz-line);
  background: color-mix(in srgb, var(--yz-page) 88%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.console__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.console__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--yz-accent);
  color: #fff;
  font-family: var(--yz-font-mono);
  font-weight: 600;
  font-size: 13px;
}
.console__title {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.console__nav {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}
.console__nav-item {
  border: none;
  background: transparent;
  padding: 6px 12px;
  border-radius: var(--yz-radius-control);
  font-size: 13px;
  font-weight: 500;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.console__nav-item:hover { color: var(--yz-ink); }
.console__nav-item--active {
  background: var(--yz-hover);
  color: var(--yz-ink);
}
.console__controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 99px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.lang-switch__item {
  border: none;
  background: transparent;
  padding: 4px 10px;
  border-radius: 99px;
  font-family: var(--yz-font-mono);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: background-color 150ms var(--yz-ease-out-strong), color 150ms var(--yz-ease-out-strong);
}
.lang-switch__item:hover { color: var(--yz-ink); }
.lang-switch__item--active {
  background: var(--yz-surface);
  color: var(--yz-ink);
  box-shadow: 0 0 0 1px var(--yz-line-strong), 0 1px 2px #1018280d;
}
.theme-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 99px;
  background: var(--yz-field);
  box-shadow: 0 0 0 1px var(--yz-line);
}
.theme-switch__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 99px;
  background: transparent;
  color: var(--yz-ink-3);
  cursor: pointer;
  transition: color 150ms var(--yz-ease-out-strong);
}
.theme-switch__item:hover { color: var(--yz-ink-2); }
.theme-switch__item--active { color: var(--yz-ink); }
.console__logout {
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: var(--yz-radius-control);
  font-size: 12.5px;
  color: var(--yz-ink-3);
  cursor: pointer;
}
.console__logout:hover { background: var(--yz-hover); color: var(--yz-tag-red); }
.console__error {
  margin: 16px 28px 0;
  padding: 10px 14px;
  border-radius: var(--yz-radius-control);
  background: var(--yz-tag-red);
  color: var(--yz-ink);
  font-size: 13px;
}
.console__main {
  padding: 24px 28px 64px;
}
</style>
