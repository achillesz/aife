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
import { useTheme } from '@/composables/useTheme'

// 使用主题 composable，获取暗色模式状态
const { isDark } = useTheme()
</script>

<style scoped lang="scss">
.line-setter {
  .title {
    width: 100px;
  }

}
</style>
