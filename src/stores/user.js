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
   * 用户注册
   * @param {object} data - 注册数据 { username, password, displayName? }
   */
  async function register(data) {
    loading.value = true
    try {
      const response = await request.post('/auth/register', {
        username: data.username,
        password: data.password,
        displayName: data.displayName,
      })
      return response
    } finally {
      loading.value = false
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
   * 1. 先从 JWT payload 提取基础信息（快速，避免白屏等待）
   * 2. 再从 API 获取完整用户信息（异步更新）
   */
  async function initUserState() {
    if (!TokenManager.isLoggedIn()) {
      userInfo.value = null
      return
    }

    // 从 JWT payload 中提取基础信息（快速恢复）
    const tokenPayload = TokenManager.getTokenPayload()
    console.log(tokenPayload, 'tokenPayload')
    if (tokenPayload) {
      // 根据你的 JWT payload 结构调整字段名
      userInfo.value = {
        id: tokenPayload.sub || tokenPayload.userId || tokenPayload.id,
        username: tokenPayload.username,
        displayName: tokenPayload.displayName || tokenPayload.name,
        // 标记为临时数据
        _fromToken: true,
      }
    }

    // 异步获取完整的用户信息
    await fetchUserInfo()
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
    register,
    fetchUserInfo,
    updateUserInfo,
    initUserState,
  }
})
