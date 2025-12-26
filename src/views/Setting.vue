<template>
  <div>
    <h2>设置</h2>
    <div>
      <span>深色</span>
      <a-switch
        type="round"
        v-model="isDark"
      />
    </div>
  </div>
</template>
<script setup>
import { watch } from 'vue'
import { useDark } from '@vueuse/core'

// useDark 直接返回一个可写的 ref，会自动在 html 上添加/移除 dark 类
const isDark = useDark()

// 同步 Arco Design 的主题属性
watch(
  isDark,
  (value) => {
    if (value) {
      document.body.setAttribute('arco-theme', 'dark')
    } else {
      document.body.removeAttribute('arco-theme')
    }
  },
  { immediate: true } // 立即执行一次，确保初始状态正确
)
</script>
