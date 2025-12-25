<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 模式切换：登录 / 注册
const isRegisterMode = ref(false)

const form = reactive({
  username: '',
  password: '',
  displayName: '',
  remember: false,
})

const isLoading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 动态标题
const pageTitle = computed(() => (isRegisterMode.value ? '创建账户' : '欢迎回来'))
const pageSubtitle = computed(() =>
  isRegisterMode.value ? '注册以开始使用服务' : '登录以继续访问您的账户',
)
const submitButtonText = computed(() => (isRegisterMode.value ? '注 册' : '登 录'))

// 切换模式
function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value
  errorMessage.value = ''
  successMessage.value = ''
  // 清空表单
  form.username = ''
  form.password = ''
  form.displayName = ''
}

// 处理表单提交
async function handleSubmit() {
  if (isRegisterMode.value) {
    await handleRegister()
  } else {
    await handleLogin()
  }
}

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await userStore.login({
      username: form.username,
      password: form.password,
    })

    // 登录成功，跳转到之前的页面或首页
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    errorMessage.value = error.message || '登录失败，请重试'
  } finally {
    isLoading.value = false
  }
}

async function handleRegister() {
  if (!form.username || !form.password) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  if (form.password.length < 6) {
    errorMessage.value = '密码长度至少为6位'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await userStore.register({
      username: form.username,
      password: form.password,
      displayName: form.displayName || undefined,
    })

    // 注册成功，显示成功消息并切换到登录模式
    successMessage.value = '注册成功！请登录'
    isRegisterMode.value = false
    form.password = ''
    form.displayName = ''
  } catch (error) {
    errorMessage.value = error.message || '注册失败，请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <!-- 动态背景 -->
    <div class="background">
      <div class="gradient-sphere sphere-1"></div>
      <div class="gradient-sphere sphere-2"></div>
      <div class="gradient-sphere sphere-3"></div>
      <div class="particles">
        <span v-for="i in 50" :key="i" class="particle"></span>
      </div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo 区域 -->
      <div class="logo-section">
        <div class="logo">
          <svg viewBox="0 0 100 100" class="logo-svg">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color: #667eea" />
                <stop offset="100%" style="stop-color: #764ba2" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" />
            <path
              d="M30 50 L45 65 L70 35"
              stroke="white"
              stroke-width="6"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <h1 class="title">{{ pageTitle }}</h1>
        <p class="subtitle">{{ pageSubtitle }}</p>
      </div>

      <!-- 表单区域 -->
      <form class="login-form" @submit.prevent="handleSubmit">
        <!-- 成功提示 -->
        <Transition name="fade">
          <div v-if="successMessage" class="success-message">
            <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2" />
              <path
                d="M9 12l2 2 4-4"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            {{ successMessage }}
          </div>
        </Transition>

        <!-- 错误提示 -->
        <Transition name="shake">
          <div v-if="errorMessage" class="error-message">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke-width="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            {{ errorMessage }}
          </div>
        </Transition>

        <!-- 用户名输入 -->
        <div class="input-group">
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle cx="12" cy="7" r="4" stroke-width="2" />
            </svg>
            <input
              v-model="form.username"
              type="text"
              class="input-field"
              placeholder="用户名 / 邮箱"
              autocomplete="username"
            />
          </div>
        </div>

        <!-- 密码输入 -->
        <div class="input-group">
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke-width="2" stroke-linecap="round" />
            </svg>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="input-field"
              placeholder="密码"
              autocomplete="current-password"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2" />
                <circle cx="12" cy="12" r="3" stroke-width="2" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line x1="1" y1="1" x2="23" y2="23" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 昵称输入 (仅注册模式) -->
        <Transition name="slide-fade">
          <div v-if="isRegisterMode" class="input-group">
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
                  stroke-width="2"
                />
                <path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round" />
              </svg>
              <input
                v-model="form.displayName"
                type="text"
                class="input-field"
                placeholder="昵称（可选）"
                autocomplete="nickname"
              />
            </div>
          </div>
        </Transition>

        <!-- 记住我 & 忘记密码 (仅登录模式) -->
        <div v-if="!isRegisterMode" class="form-options">
          <label class="remember-me">
            <input v-model="form.remember" type="checkbox" class="checkbox" />
            <span class="checkmark"></span>
            <span class="label-text">记住我</span>
          </label>
          <a href="#" class="forgot-password">忘记密码？</a>
        </div>

        <!-- 提交按钮 -->
        <button type="submit" class="login-button" :disabled="isLoading">
          <span v-if="!isLoading" class="button-text">{{ submitButtonText }}</span>
          <span v-else class="loading-spinner">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="3" fill="none" />
            </svg>
          </span>
          <div class="button-glow"></div>
        </button>

        <!-- 分割线 (仅登录模式) -->
        <template v-if="!isRegisterMode">
          <div class="divider">
            <span>或使用以下方式登录</span>
          </div>

          <!-- 社交登录 -->
          <div class="social-login">
            <button type="button" class="social-button wechat">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.32.32 0 0 0 .167-.054l1.903-1.114a.86.86 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.72.72 0 0 1 .598.082l1.584.926a.27.27 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.49.49 0 0 1 .177-.554C23.162 18.381 24 16.77 24 15.017c0-3.375-3.042-6.112-7.062-6.159zm-2.001 2.299c.535 0 .969.44.969.982a.98.98 0 0 1-.969.983.98.98 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.801 0c.535 0 .969.44.969.982a.98.98 0 0 1-.969.983.98.98 0 0 1-.969-.983c0-.542.434-.982.969-.982z"
                />
              </svg>
            </button>
            <button type="button" class="social-button github">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"
                />
              </svg>
            </button>
            <button type="button" class="social-button google">
              <svg viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>
          </div>
        </template>

        <!-- 切换链接 -->
        <p class="register-link">
          <template v-if="!isRegisterMode">
            还没有账户？
            <a href="#" @click.prevent="toggleMode">立即注册</a>
          </template>
          <template v-else>
            已有账户？
            <a href="#" @click.prevent="toggleMode">立即登录</a>
          </template>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* ==================== 基础样式 ==================== */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

/* ==================== 动态背景 ==================== */
.background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.gradient-sphere {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.sphere-1 {
  width: 600px;
  height: 600px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  top: -200px;
  left: -100px;
  animation-delay: 0s;
}

.sphere-2 {
  width: 500px;
  height: 500px;
  background: linear-gradient(180deg, #f093fb 0%, #f5576c 100%);
  bottom: -150px;
  right: -100px;
  animation-delay: -5s;
}

.sphere-3 {
  width: 400px;
  height: 400px;
  background: linear-gradient(180deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -10s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-30px) rotate(5deg);
  }
  50% {
    transform: translateY(20px) rotate(-5deg);
  }
  75% {
    transform: translateY(-15px) rotate(3deg);
  }
}

/* 粒子效果 */
.particles {
  position: absolute;
  inset: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: sparkle 4s ease-in-out infinite;
}

.particle:nth-child(odd) {
  animation-duration: 3s;
}

.particle:nth-child(3n) {
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0;
    transform: translateY(0) scale(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-100px) scale(1);
  }
}

/* 随机分布粒子 */
.particle:nth-child(1) {
  left: 5%;
  top: 90%;
  animation-delay: 0s;
}
.particle:nth-child(2) {
  left: 10%;
  top: 85%;
  animation-delay: 0.2s;
}
.particle:nth-child(3) {
  left: 15%;
  top: 95%;
  animation-delay: 0.4s;
}
.particle:nth-child(4) {
  left: 20%;
  top: 88%;
  animation-delay: 0.6s;
}
.particle:nth-child(5) {
  left: 25%;
  top: 92%;
  animation-delay: 0.8s;
}
.particle:nth-child(6) {
  left: 30%;
  top: 87%;
  animation-delay: 1s;
}
.particle:nth-child(7) {
  left: 35%;
  top: 93%;
  animation-delay: 1.2s;
}
.particle:nth-child(8) {
  left: 40%;
  top: 89%;
  animation-delay: 1.4s;
}
.particle:nth-child(9) {
  left: 45%;
  top: 91%;
  animation-delay: 1.6s;
}
.particle:nth-child(10) {
  left: 50%;
  top: 86%;
  animation-delay: 1.8s;
}
.particle:nth-child(11) {
  left: 55%;
  top: 94%;
  animation-delay: 2s;
}
.particle:nth-child(12) {
  left: 60%;
  top: 88%;
  animation-delay: 2.2s;
}
.particle:nth-child(13) {
  left: 65%;
  top: 92%;
  animation-delay: 2.4s;
}
.particle:nth-child(14) {
  left: 70%;
  top: 87%;
  animation-delay: 2.6s;
}
.particle:nth-child(15) {
  left: 75%;
  top: 95%;
  animation-delay: 2.8s;
}
.particle:nth-child(16) {
  left: 80%;
  top: 89%;
  animation-delay: 3s;
}
.particle:nth-child(17) {
  left: 85%;
  top: 93%;
  animation-delay: 3.2s;
}
.particle:nth-child(18) {
  left: 90%;
  top: 86%;
  animation-delay: 3.4s;
}
.particle:nth-child(19) {
  left: 95%;
  top: 91%;
  animation-delay: 3.6s;
}
.particle:nth-child(20) {
  left: 8%;
  top: 82%;
  animation-delay: 3.8s;
}
.particle:nth-child(n + 21) {
  display: none;
}

/* ==================== 登录卡片 ==================== */
.login-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  animation: cardEntry 0.8s ease-out;
}

@keyframes cardEntry {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ==================== Logo 区域 ==================== */
.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 70px;
  height: 70px;
  margin: 0 auto 16px;
  animation: logoFloat 3s ease-in-out infinite;
}

.logo-svg {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.4));
}

@keyframes logoFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* ==================== 表单样式 ==================== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 错误提示 */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  color: #fca5a5;
  font-size: 14px;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* 成功提示 */
.success-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  color: #86efac;
  font-size: 14px;
}

.success-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.shake-enter-active {
  animation: shake 0.5s ease-out;
}

/* 滑动淡入动画 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-8px);
  }
  40%,
  80% {
    transform: translateX(8px);
  }
}

/* 输入框组 */
.input-group {
  position: relative;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  width: 20px;
  height: 20px;
  color: rgba(255, 255, 255, 0.5);
  pointer-events: none;
  transition: color 0.3s ease;
}

.input-field {
  width: 100%;
  padding: 16px 48px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  font-size: 15px;
  color: #fff;
  outline: none;
  transition: all 0.3s ease;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.input-field:focus {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(102, 126, 234, 0.6);
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
}

.input-field:focus + .input-icon,
.input-wrapper:focus-within .input-icon {
  color: #667eea;
}

.toggle-password {
  position: absolute;
  right: 16px;
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: color 0.3s ease;
}

.toggle-password:hover {
  color: rgba(255, 255, 255, 0.8);
}

.toggle-password svg {
  width: 100%;
  height: 100%;
}

/* 表单选项 */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 5px;
  position: relative;
  transition: all 0.3s ease;
}

.checkbox:checked + .checkmark {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
}

.checkmark::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s ease;
}

.checkbox:checked + .checkmark::after {
  transform: rotate(45deg) scale(1);
}

.forgot-password {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.3s ease;
}

.forgot-password:hover {
  color: #667eea;
}

/* 登录按钮 */
.login-button {
  position: relative;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgba(102, 126, 234, 0.5);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.login-button:hover .button-glow {
  transform: translateX(100%);
}

/* 加载动画 */
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

.spinner circle {
  stroke: white;
  stroke-dasharray: 50;
  stroke-dashoffset: 20;
  stroke-linecap: round;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 分割线 */
.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

/* 社交登录 */
.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.social-button {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-button svg {
  width: 24px;
  height: 24px;
}

.social-button:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.15);
}

.social-button.wechat {
  color: #07c160;
}

.social-button.wechat:hover {
  border-color: #07c160;
  box-shadow: 0 8px 20px -8px rgba(7, 193, 96, 0.4);
}

.social-button.github {
  color: #fff;
}

.social-button.github:hover {
  border-color: #fff;
  box-shadow: 0 8px 20px -8px rgba(255, 255, 255, 0.3);
}

.social-button.google:hover {
  border-color: #4285f4;
  box-shadow: 0 8px 20px -8px rgba(66, 133, 244, 0.4);
}

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.register-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.register-link a:hover {
  color: #764ba2;
}

/* ==================== 响应式 ==================== */
@media (max-width: 480px) {
  .login-card {
    padding: 30px 24px;
  }

  .title {
    font-size: 24px;
  }

  .social-button {
    width: 48px;
    height: 48px;
  }
}
</style>
