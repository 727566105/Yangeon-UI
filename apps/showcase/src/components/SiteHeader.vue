<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <header class="site-header">
    <div class="site-header__inner">
      <div class="site-header__brand">
        <span class="site-header__logo">YZ</span>
        <div>
          <h1 class="site-header__title">Yzen-UI</h1>
          <p class="site-header__slogan">Build AI-native interfaces</p>
        </div>
      </div>
      <ThemeToggle />
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--yz-page);
  border-bottom: 1px solid var(--yz-line);
  backdrop-filter: blur(8px);
}
.site-header__inner {
  max-width: 72rem;
  margin-inline: auto;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.site-header__brand { display: flex; align-items: center; gap: 12px; }
.site-header__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px; height: 36px;
  border-radius: 10px;
  background: var(--yz-accent);
  color: #fff;
  font-family: var(--yz-font-mono);
  font-weight: 600;
  font-size: 14px;
}
.site-header__title { margin: 0; font-size: 16px; font-weight: 600; color: var(--yz-ink); }
.site-header__slogan { margin: 0; font-size: 12px; color: var(--yz-ink-3); }
</style>
