<template>
  <div class="layout">
    <a-layout class="layout-container">
      <!-- 左侧边栏 -->
      <a-layout-sider
        :width="siderWidth"
        :collapsed-width="collapsedWidth"
        :collapsed="collapsed"
        :collapsible="true"
        :hide-trigger="true"
        class="layout-sider"
      >
        <div class="sider-content">
          <!-- Logo 区域 -->
          <div class="logo-area">
            <div class="logo">
              <svg
                viewBox="0 0 100 100"
                class="logo-icon"
              >
                <defs>
                  <linearGradient
                    id="siderLogoGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style="stop-color: #667eea"
                    />
                    <stop
                      offset="100%"
                      style="stop-color: #764ba2"
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="url(#siderLogoGradient)"
                />
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
            <span
              v-show="!collapsed"
              class="logo-text"
            >AIFE</span>
          </div>

          <!-- 菜单区域（占位） -->
          <div class="menu-area">
            <a-tooltip content="首页">
              <RouterLink :to="{ name: 'Home' }">
                <div
                  class="menu-item"
                  :class="{ collapsed }"
                >
                  <icon-home
                    class="menu-icon"
                    :size="24"
                  />
                  <span
                    v-show="!collapsed"
                    class="menu-text"
                  >首页</span>
                </div>
              </RouterLink>
            </a-tooltip>
            <a-tooltip content="设置">
              <RouterLink :to="{ name: 'Setting' }">
                <div
                  class="menu-item"
                  :class="{ collapsed }"
                >
                  <icon-settings
                    class="menu-icon"
                    :size="24"
                  />
                  <span
                    v-show="!collapsed"
                    class="menu-text"
                  >设置</span>
                </div>
              </RouterLink>
            </a-tooltip>
            <div
              class="menu-item"
              :class="{ collapsed }"
            >
              <icon-user
                class="menu-icon"
                :size="24"
              />
              <span
                v-show="!collapsed"
                class="menu-text"
              >用户</span>
            </div>
          </div>
          <div class="chat-history">
            <div>聊天历史：</div>
            <div></div>
          </div>
        </div>

        <!-- 收缩按钮 -->
        <div
          class="collapse-btn"
          @click="toggleCollapse"
        >
          <icon-menu-fold v-if="!collapsed" />
          <icon-menu-unfold v-else />
        </div>
      </a-layout-sider>

      <!-- 右侧内容区 -->
      <a-layout class="layout-main">
        <a-layout-content class="layout-content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  IconHome,
  IconSettings,
  IconUser,
  IconMenuFold,
  IconMenuUnfold,
} from '@arco-design/web-vue/es/icon'

// 侧边栏状态
const collapsed = ref(false)
const siderWidth = 200
const collapsedWidth = 48

// 切换收缩状态
function toggleCollapse() {
  collapsed.value = !collapsed.value
}
</script>

<style scoped lang="scss">
.layout {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.layout-container {
  height: 100%;
}

.layout-sider {
  display: flex;
  flex-direction: column;
  background: var(--sider-bg);
  box-shadow: var(--sider-shadow);
  transition: width 0.3s ease, background 0.3s ease;
  position: relative;

  :deep(.arco-layout-sider-children) {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
}

.sider-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Logo 区域
.logo-area {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
  border-bottom: 1px solid var(--sider-border-color);
  min-height: 64px;
}

.logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-icon {
  width: 100%;
  height: 100%;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--sider-logo-text-color);
  white-space: nowrap;
  letter-spacing: 2px;
  transition: color 0.3s ease;
}

.chat-history {
  flex: 1;
}

// 菜单区域
.menu-area {
  padding: 8px;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  border-radius: 8px;
  color: var(--sider-text-color);
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4px;

  &:hover {
    background: var(--sider-item-hover-bg);
    color: var(--sider-text-color-hover);
  }

  &.collapsed {
    justify-content: center;
    padding: 12px 0; // 调整 padding，给图标留出足够空间
  }
}

.menu-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.menu-text {
  font-size: 14px;
  white-space: nowrap;
}

// 收缩按钮
.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  border-top: 1px solid var(--sider-border-color);
  color: var(--sider-text-color);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--sider-item-hover-bg);
    color: var(--sider-text-color-hover);
  }

  svg {
    font-size: 18px;
  }
}

// 主内容区
.layout-main {
  flex: 1;
  overflow: hidden;
}

.layout-content {
  height: 100%;
  overflow: auto;
  // background: #f5f7fa;
}
</style>
