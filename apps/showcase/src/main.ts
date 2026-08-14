import { createApp } from 'vue'
import App from './App.vue'

// 主题初始化（先于渲染，避免闪烁）
const saved = localStorage.getItem('yz-theme')
if (saved === 'dark') document.documentElement.dataset.theme = 'dark'

createApp(App).mount('#app')
