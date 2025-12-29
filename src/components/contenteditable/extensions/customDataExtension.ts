import { Extension } from '@tiptap/core'

// 定义一个接口来规范我们要存储的数据类型
// 这样可以确保类型安全，并获得良好的代码提示
export interface CustomDataStorage {
  data: Record<string, any>
}

// 声明一个自定义的扩展类型，并包含我们定义的 storage 类型
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customData: {
      // 在这里可以添加你希望的命令，例如设置或获取数据
      setCustomData: (data: CustomDataStorage) => ReturnType
    }
  }
}

const CustomDataExtension = Extension.create<any, CustomDataStorage>({
  name: 'customData',

  // addStorage 是 Tiptap 存储自定义数据的地方
  addStorage() {
    return {
      data: {},
    }
  },

  // 这里可以定义一些命令，方便在组件中操作数据
  addCommands() {
    return {
      setCustomData:
        data =>
        ({ editor }) => {
          // 使用 Object.assign 来合并新的数据，防止覆盖
          Object.assign((editor.storage as any).customData.data, data)
          return true
        },
    }
  },

  // 也可以定义一些事件钩子，例如在编辑器创建时加载数据
  onBeforeCreate({ editor }) {
    // 假设你有初始数据需要加载
    // editor.storage.customData.userId = 'initial_user_id';
  },
})

export default CustomDataExtension
