import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    tailwindcss(),
    // 自动导入 API（如 Message, Notification 等）
    AutoImport({
      resolvers: [ArcoResolver()],
      // 生成自动导入的类型声明文件
      dts: 'src/auto-imports.d.ts',
    }),
    // 自动导入组件
    Components({
      resolvers: [
        ArcoResolver({
          // 自动导入组件对应的样式
          sideEffect: true,
        }),
      ],
      // 生成组件类型声明文件
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
