import { TokenManager } from '@/utils/request'

/**
 * 路由守卫配置
 * 用于控制路由访问权限
 */

// 不需要登录的页面白名单
const AUTH_WHITE_LIST = ['/login', '/register', '/forgot-password', '/404', '/500']

/**
 * 设置路由守卫
 * @param {Router} router - Vue Router 实例
 */
export function setupRouterGuards(router) {
  router.beforeEach(async (to, from, next) => {
    const isLoggedIn = TokenManager.isLoggedIn()

    // 目标路由需要认证
    const requiresAuth = to.meta?.requiresAuth !== false

    // 如果在白名单中，直接放行
    if (AUTH_WHITE_LIST.includes(to.path)) {
      // 如果已登录且访问登录页，重定向到首页
      if (isLoggedIn && to.path === '/login') {
        next({ path: '/' })
        return
      }
      next()
      return
    }

    // 需要认证但未登录
    if (requiresAuth && !isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
      return
    }

    // 其他情况放行
    next()
  })
}
