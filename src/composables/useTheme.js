import { watch } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

// 单例模式，确保全局只有一个实例
let initialized = false

/**
 * 主题管理 composable
 * 封装暗色模式的状态管理和 Arco Design 主题同步
 */
export function useTheme() {
  // useDark 直接返回一个可写的 ref，会自动在 html 上添加/移除 dark 类
  const isDark = useDark()
  const toggleDark = useToggle(isDark)

  // 同步 Arco Design 的主题属性（只初始化一次）
  if (!initialized) {
    watch(
      isDark,
      (value) => {
        if (value) {
          document.body.setAttribute('arco-theme', 'dark')
        } else {
          document.body.removeAttribute('arco-theme')
        }
      },
      { immediate: true },
    )
    initialized = true
  }

  return {
    isDark,
    toggleDark,
  }
}
