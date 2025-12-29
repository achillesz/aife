<script setup>
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useTheme } from '@/composables/useTheme'

const userStore = useUserStore()

// 应用启动时初始化主题（同步 Arco Design 主题属性）
useTheme()

// 应用启动时初始化用户状态
// 如果 JWT 有效，会自动从 API 获取最新用户信息
onMounted(() => {
  userStore.initUserState()
})
</script>

<template>
  <router-view />
</template>

<style scoped></style>
