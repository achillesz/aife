import { createRouter, createWebHashHistory } from 'vue-router'
import { setupRouterGuards } from './guards'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    // 示例路由配置
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true }, // 需要登录
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }, // 不需要登录
    },
    // {
    //   path: '/dashboard',
    //   name: 'Dashboard',
    //   component: () => import('@/views/Dashboard.vue'),
    //   meta: { requiresAuth: true }, // 需要登录（默认）
    // },
  ],
})

// 设置路由守卫
setupRouterGuards(router)

export default router
