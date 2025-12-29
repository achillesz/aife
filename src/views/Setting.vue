<template>
  <div class="pl-[50px] pt-[30px]">
    <h2 class="text-[30px]">设置</h2>
    <div class="mt-[20px] line-setter flex items-center gap-[10px]">
      <span class="title
      text-[14px]">深色</span>
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

<style scoped lang="scss">
.line-setter {
  .title {
    width: 100px;
  }

}
</style>
