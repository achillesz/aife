import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import IconFont from '@/components/icons/IconFont.vue'

// 全局样式
// 顺序: SCSS(含 reset) → Tailwind
// Tailwind 在后加载，工具类能覆盖 reset
import '@/styles/index.scss'
import '@/styles/tailwind.css'

const app = createApp(App)
app.component('IconFont', IconFont)

app.use(createPinia())
app.use(router)

app.mount('#app')
