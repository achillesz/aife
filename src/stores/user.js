import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request, { TokenManager } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  // ==================== State ====================
  const userInfo = ref(null)
  const loading = ref(false)

  // ==================== Getters ====================
  const isLoggedIn = computed(() => TokenManager.isLoggedIn())
  const userName = computed(() => userInfo.value?.name || '')
  const userAvatar = computed(() => userInfo.value?.avatar || '')

  // ==================== Actions ====================

  /**
   * 用户登录
   * @param {object} credentials - 登录凭证 { username, password }
   */
  async function login(credentials) {
    loading.value = true
    try {
      const response = await request.post('/auth/login', credentials)

      // 保存 token
      const { accessToken, refreshToken, user } = response
      TokenManager.setToken(accessToken)
      if (refreshToken) {
        TokenManager.setRefreshToken(refreshToken)
      }

      // 保存用户信息
      userInfo.value = user

      return response
    } finally {
      loading.value = false
    }
  }

  /**
   * 用户登出
   */
  async function logout() {
    try {
      // 可选：通知后端登出
      await request.post('/auth/logout').catch(() => {
        // 忽略登出请求失败
      })
    } finally {
      // 清除本地状态
      TokenManager.clearTokens()
      userInfo.value = null
    }
  }

  /**
   * 获取当前用户信息
   */
  async function fetchUserInfo() {
    if (!TokenManager.isLoggedIn()) {
      return null
    }

    loading.value = true
    try {
      const user = await request.get('/user/profile')
      userInfo.value = user
      return user
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用户信息
   * @param {object} data - 要更新的用户数据
   */
  async function updateUserInfo(data) {
    loading.value = true
    try {
      const user = await request.put('/user/profile', data)
      userInfo.value = { ...userInfo.value, ...user }
      return user
    } finally {
      loading.value = false
    }
  }

  /**
   * 初始化用户状态（应用启动时调用）
   */
  async function initUserState() {
    if (TokenManager.isLoggedIn()) {
      await fetchUserInfo()
    }
  }

  return {
    // State
    userInfo,
    loading,
    // Getters
    isLoggedIn,
    userName,
    userAvatar,
    // Actions
    login,
    logout,
    fetchUserInfo,
    updateUserInfo,
    initUserState,
  }
})
