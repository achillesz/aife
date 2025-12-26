import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 全局样式
import '@/styles/tailwind.css' // Tailwind CSS v4
import '@/styles/index.scss' // 自定义样式

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
