import axios from 'axios'
import router from '@/router'

// ==================== 配置常量 ====================
const DEFAULT_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
}

// Token 存储 key
const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// 不需要登录校验的白名单路径
const WHITE_LIST = ['/auth/login', '/auth/register', '/auth/refresh']

// ==================== Token 管理 ====================
export const TokenManager = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setRefreshToken(token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  },

  clearTokens() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },

  isLoggedIn() {
    return !!this.getToken()
  },
}

// ==================== 创建 Axios 实例 ====================
const service = axios.create(DEFAULT_CONFIG)

// ==================== 请求拦截器 ====================
service.interceptors.request.use(
  (config) => {
    // 检查是否在白名单中
    const isWhiteListed = WHITE_LIST.some((path) => config.url?.includes(path))

    // 如果不在白名单中，添加 token
    if (!isWhiteListed) {
      const token = TokenManager.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  },
)

// ==================== 响应拦截器 ====================
// 是否正在刷新 token
let isRefreshing = false
// 等待刷新 token 的请求队列
let refreshSubscribers = []

// 将请求添加到等待队列
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback)
}

// 通知所有等待的请求
function onTokenRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

// 刷新 token
async function refreshToken() {
  try {
    const refreshToken = TokenManager.getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const response = await axios.post(`${DEFAULT_CONFIG.baseURL}/auth/refresh`, {
      refreshToken,
    })

    const { accessToken, refreshToken: newRefreshToken } = response.data

    TokenManager.setToken(accessToken)
    if (newRefreshToken) {
      TokenManager.setRefreshToken(newRefreshToken)
    }

    return accessToken
  } catch (error) {
    TokenManager.clearTokens()
    throw error
  }
}

// 处理未授权
function handleUnauthorized() {
  TokenManager.clearTokens()
  // 跳转到登录页，并记录当前路径
  const currentPath = window.location.pathname + window.location.search
  router.push({
    path: '/login',
    query: { redirect: currentPath },
  })
}

service.interceptors.response.use(
  (response) => {
    // 根据后端返回格式，可以在这里统一处理
    const res = response.data

    // 假设后端返回格式为 { code: 0, data: {}, message: '' }
    // 如果后端直接返回数据，可以直接 return res
    if (res.code !== undefined) {
      if (res.code === 0 || res.code === 200) {
        return res.data
      } else {
        // 业务错误
        console.error('业务错误:', res.message)
        return Promise.reject(new Error(res.message || '请求失败'))
      }
    }

    // 如果没有 code 字段，直接返回数据
    return res
  },
  async (error) => {
    const { config, response } = error

    if (!response) {
      console.error('网络错误:', error.message)
      return Promise.reject(new Error('网络连接失败，请检查网络'))
    }

    const { status } = response

    // 401 未授权 - token 过期或无效
    if (status === 401) {
      // 检查是否在白名单中（登录请求本身返回 401）
      const isWhiteListed = WHITE_LIST.some((path) => config.url?.includes(path))
      if (isWhiteListed) {
        return Promise.reject(error)
      }

      // 尝试刷新 token
      if (!isRefreshing) {
        isRefreshing = true

        try {
          const newToken = await refreshToken()
          isRefreshing = false
          onTokenRefreshed(newToken)

          // 重试当前请求
          config.headers.Authorization = `Bearer ${newToken}`
          return service(config)
        } catch (refreshError) {
          isRefreshing = false
          refreshSubscribers = []
          handleUnauthorized()
          return Promise.reject(refreshError)
        }
      } else {
        // 正在刷新 token，将请求加入队列
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            config.headers.Authorization = `Bearer ${token}`
            resolve(service(config))
          })
        })
      }
    }

    // 403 禁止访问
    if (status === 403) {
      console.error('无权限访问')
      return Promise.reject(new Error('无权限访问该资源'))
    }

    // 404 资源不存在
    if (status === 404) {
      console.error('资源不存在:', config.url)
      return Promise.reject(new Error('请求的资源不存在'))
    }

    // 500 服务器错误
    if (status >= 500) {
      console.error('服务器错误:', response.data)
      return Promise.reject(new Error('服务器内部错误，请稍后重试'))
    }

    return Promise.reject(error)
  },
)

// ==================== 请求方法封装 ====================
const request = {
  /**
   * GET 请求
   * @param {string} url - 请求地址
   * @param {object} params - 查询参数
   * @param {object} config - 额外配置
   */
  get(url, params = {}, config = {}) {
    return service.get(url, { params, ...config })
  },

  /**
   * POST 请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求体数据
   * @param {object} config - 额外配置
   */
  post(url, data = {}, config = {}) {
    return service.post(url, data, config)
  },

  /**
   * PUT 请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求体数据
   * @param {object} config - 额外配置
   */
  put(url, data = {}, config = {}) {
    return service.put(url, data, config)
  },

  /**
   * PATCH 请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求体数据
   * @param {object} config - 额外配置
   */
  patch(url, data = {}, config = {}) {
    return service.patch(url, data, config)
  },

  /**
   * DELETE 请求
   * @param {string} url - 请求地址
   * @param {object} params - 查询参数
   * @param {object} config - 额外配置
   */
  delete(url, params = {}, config = {}) {
    return service.delete(url, { params, ...config })
  },

  /**
   * 上传文件
   * @param {string} url - 请求地址
   * @param {FormData} formData - 表单数据
   * @param {function} onProgress - 上传进度回调
   */
  upload(url, formData, onProgress = null, config = {}) {
    return service.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress
        ? (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percent, progressEvent)
          }
        : undefined,
      ...config,
    })
  },

  /**
   * 下载文件
   * @param {string} url - 请求地址
   * @param {object} params - 查询参数
   * @param {string} filename - 文件名
   */
  async download(url, params = {}, filename = 'download') {
    const response = await service.get(url, {
      params,
      responseType: 'blob',
    })

    // 创建下载链接
    const blob = new Blob([response])
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)

    return response
  },
}

// 导出 axios 实例（用于特殊场景）
export { service as axiosInstance }

// 默认导出请求方法
export default request
