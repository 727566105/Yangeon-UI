<script setup lang="ts">
import { ref } from 'vue'
import { login, setToken } from '../api'
import { useI18n } from '../i18n'

const emit = defineEmits<{ (e: 'logged-in'): void }>()
const { t } = useI18n()

const password = ref('')
const busy = ref(false)
const error = ref('')

async function submit() {
  if (!password.value || busy.value) return
  busy.value = true
  error.value = ''
  try {
    const result = await login(password.value)
    if (result.ok) {
      setToken(result.token) // 持久化会话（刷新免登录）
      emit('logged-in')
    } else {
      error.value = t('login.wrongPassword')
    }
  } catch {
    error.value = t('common.error')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="login">
    <form class="login__card" @submit.prevent="submit">
      <div class="login__brand">
        <span class="login__logo">YZ</span>
        <h1 class="login__title">{{ t('app.title') }}</h1>
      </div>
      <label class="login__field">
        <span class="login__label">{{ t('login.password') }}</span>
        <input
          v-model="password"
          class="login__input"
          type="password"
          :placeholder="t('login.passwordPlaceholder')"
          autofocus
        />
      </label>
      <p v-if="error" class="login__error">{{ error }}</p>
      <button type="submit" class="login__btn" :disabled="busy || !password">
        {{ busy ? t('common.saving') : t('login.submit') }}
      </button>
      <p class="login__hint">{{ t('login.hint') }}</p>
    </form>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--yz-page);
  color: var(--yz-ink);
  font-family: var(--yz-font-sans);
}
.login__card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(360px, calc(100vw - 48px));
  padding: 28px;
  border-radius: var(--yz-radius-window);
  background: var(--yz-surface);
  box-shadow: var(--yz-shadow-overlay);
}
.login__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.login__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--yz-accent);
  color: #fff;
  font-family: var(--yz-font-mono);
  font-weight: 600;
  font-size: 14px;
}
.login__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.login__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.login__label {
  font-size: 12px;
  color: var(--yz-ink-3);
}
.login__input {
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--yz-line-strong);
  border-radius: var(--yz-radius-control);
  background: var(--yz-surface);
  color: var(--yz-ink);
  font-size: 13px;
  outline: none;
}
.login__input:focus {
  border-color: var(--yz-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--yz-accent) 20%, transparent);
}
.login__error {
  margin: 0;
  font-size: 12.5px;
  color: var(--yz-tag-red);
}
.login__btn {
  height: 36px;
  border: none;
  border-radius: var(--yz-radius-control);
  background: var(--yz-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 150ms var(--yz-ease-out-strong);
}
.login__btn:active { transform: scale(0.98); }
.login__btn:disabled { opacity: 0.6; cursor: default; }
.login__hint {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--yz-ink-3);
}
</style>
