<template>
  <div
    ref="editorDomRef"
    class="chat-wrap"
  >
    <editor-content
      :editor="editor"
      class="aaa"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, computed, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { mergeAttributes } from '@tiptap/core'
import { Placeholder } from '@tiptap/extensions'
import StarterKit from '@tiptap/starter-kit'
import { VariableTag } from './extensions/VariableTag'
import CustomDataExtension from './extensions/customDataExtension'
// import Mention from '@tiptap/extension-mention'
// import suggestion from './mention/suggestion.js'

const emit = defineEmits(['update:isFocused', 'update:modelValue', 'submit'])

// 定义属性 isFocus
const { modelValue, placeholder, mentionable, submitClearable } = defineProps({
  isFocused: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [Object, Array],
    default: () => ({ type: 'doc', content: [] }),
  },
  placeholder: {
    type: String,
    default: '',
  },
  mentionable: {
    type: Boolean,
    default: false,
  },
  // 是否在提交内容时清空输入框
  submitClearable: {
    type: Boolean,
    default: true,
  },
})

const mentionEditor = computed(() => {
  if (mentionable) {
    return [
      Mention.configure({
        renderText({ options, node }) {
          return `${node.attrs.mentionSuggestionChar}{${node.attrs.id}}`
        },
        renderHTML({ options, node }) {
          return [
            'span',
            mergeAttributes({ class: 'mention' }, options.HTMLAttributes),
            // node json
            // {
            //   type: 'mention',
            //   attrs: {
            //     id: '00f5760d-f921-424f-adaa-6a94b812baab',
            //     label: '我不是超级管理员 勿删',
            //     mentionSuggestionChar: '@',
            //   },
            // },
            `${node.attrs.mentionSuggestionChar}${node.attrs.label ?? node.attrs.id}`,
          ]
        },
        deleteTriggerWithBackspace: true,
        // suggestion,
      }),
    ]
  } else {
    return []
  }
})

const editor = useEditor({
  content: '',
  extensions: [
    ...mentionEditor.value,
    StarterKit.configure({
      history: false,
      // heading: false,
      // bulletList: false,
      // orderedList: false,
      // codeBlock: false,
      paragraph: { HTMLAttributes: { class: 'tt-p' } },
    }),
    Placeholder.configure({ placeholder }),
    VariableTag,
    // 将自定义扩展添加到这里
    CustomDataExtension,
  ],
  autofocus: true,
  onUpdate: ({ editor }) => {
    let data = editor.getJSON()
    // console.log('data.....', data)
    emit('update:modelValue', data)
  },
  editorProps: {
    attributes: {
      class: 'chat-editor',
    },
    handleKeyDown(view, event) {
      if (event.isComposing) return false

      if (event.key === 'Enter') {
        if (event.shiftKey) {
          event.preventDefault()
          editor.value.commands.splitBlock() // 新建段落
          return true
        }

        // 判断提交条件
        const text = view.state.doc.textContent?.trim() ?? ''
        if (text.length > 0 && /* 你的提交判断 */ true) {
          event.preventDefault()
          emit('submit')
          if (editor?.value) {
            if (submitClearable) editor.value.chain().clearContent().run()
            editor.value.commands.focus()
          }
          return true
        }

        // 普通 Enter 也不拦截，走默认行为
        return false
      }

      return false
    },

    handlePaste(view, event, slice) {
      // 获取粘贴板数据
      const clipboardData = event.clipboardData || window.clipboardData
      const htmlData = clipboardData.getData('text/html')
      const textData = clipboardData.getData('text/plain')

      console.log('粘贴内容调试:', {
        htmlData,
        textData,
        slice: slice.content.toJSON(),
        hasHTML: !!htmlData,
        hasText: !!textData,
      })

      // 如果有 HTML 内容，让 Tiptap 处理
      if (htmlData && htmlData.trim()) {
        // 返回 false 让 Tiptap 使用默认的粘贴处理
        return false
      }

      // 如果只有纯文本，也让 Tiptap 处理
      if (textData && textData.trim()) {
        return false
      }

      // 阻止空内容粘贴
      event.preventDefault()
      return true
    },

    handleDOMEvents: {},
  },
})

let isBound = false

watch(editor, e => {
  if (!e || isBound) return
  isBound = true
  e.on('focus', () => emit('update:isFocused', true))
  e.on('blur', () => emit('update:isFocused', false))
  e.on('update', d => { })

  e.on('transaction', ({ editor, transaction }) => { })

  // ✅ 监听复制事件（确保 editor 已挂载 DOM）
  const editableDom = e.view.dom
  console.log(editableDom, 'editableDom???????....')
})

// 监听 modelValue 变化，同步到编辑器
watch(
  () => modelValue,
  newVal => {
    if (!editor.value || !newVal) return

    // 避免循环更新
    const currentContent = editor.value.getJSON()
    if (JSON.stringify(currentContent) !== JSON.stringify(newVal)) {
      if (Array.isArray(newVal)) {
        // 如果是数组格式，包装成 doc 格式
        editor.value.commands.setContent({
          type: 'doc',
          content: newVal,
        })
      } else {
        // 如果已经是完整的 doc 格式
        editor.value.commands.setContent(newVal)
      }
    }
  },
  { deep: true },
)

// 定位焦点：优先第一个空的 variableTag，否则文档末尾
const focusToFirstEmptyOrEnd = e => {
  if (!e) return
  const { state } = e

  let targetPos = null
  state.doc.descendants((node, pos) => {
    if (node.type && node.type.name === 'variableTag') {
      const hasText =
        (node.textContent || '').trim().length > 0 || (node.content && node.content.size > 0)
      if (!hasText && targetPos === null) {
        targetPos = pos + 1
        return false // 停止遍历
      }
    }
    return true
  })

  if (targetPos === null) {
    targetPos = state.doc.content.size
  }

  e.commands.setTextSelection(targetPos)
  e.commands.focus()
}

const resetFocus = () => {
  setTimeout(() => {
    focusToFirstEmptyOrEnd(editor?.value)
  }, 0)
}

const replaceWithTemplate = list => {
  editor?.value.commands.setContent({
    type: 'doc',
    content: list,
  })

  resetFocus()

  // 设置光标：优先定位到“第一个空的 variableTag”内部，否则定位到文档末尾
}

// 添加 getJSON 方法
const getJSON = () => {
  return editor?.value?.getJSON() || { type: 'doc', content: [] }
}

// 获取纯文本内容
const getText = () => {
  return editor?.value?.getText() || ''
}

// 获取HTML内容
const getHTML = () => {
  return editor?.value?.getHTML() || ''
}

// 设置焦点
const focus = () => {
  editor?.value?.commands.focus()
}

const blur = () => {
  editor?.value?.commands.blur()
}

const insert = val => {
  editor?.value?.commands.insertContent(val)
}

// 清空编辑器内容
const clearContent = () => {
  editor?.value?.commands.clearContent()
  editor?.value?.chain().clearContent().run()
}

// 获取纯文本内容（包含空 variableTag 的占位符）
const getTextWithPlaceholders = () => {
  const e = editor?.value
  if (!e) return ''

  const json = e.getJSON()
  const parts = []
  const FEFF = /\uFEFF/g

  const hasNonEmptyText = node => {
    if (!node || !node.content) return false
    for (const child of node.content) {
      if (child.type === 'text' && (child.text || '').replace(FEFF, '').trim().length > 0) {
        return true
      }
      if (child.content && hasNonEmptyText(child)) {
        return true
      }
    }
    return false
  }

  const walk = node => {
    if (!node) return
    const type = node.type

    if (type === 'text') {
      parts.push((node.text || '').replace(FEFF, ''))
      return
    }

    if (type === 'hardBreak' || type === 'hard_break') {
      parts.push('\n')
      return
    }

    if (type === 'variableTag') {
      // 如果 variableTag 内没有用户输入，用 placeholder 代替
      const filled = hasNonEmptyText(node)
      if (filled) {
        if (node.content) node.content.forEach(walk)
      } else {
        parts.push(node?.attrs?.placeholder ?? '')
      }
      return
    }

    if (type === 'paragraph') {
      if (node.content) node.content.forEach(walk)
      parts.push('\n')
      return
    }

    // 其他节点：递归其子节点
    if (node.content) node.content.forEach(walk)
  }

  walk(json)
  // 去掉末尾多余换行
  return parts.join('').replace(/\n+$/, '')
}

// 导出方法 replaceWithTemplate 提供 vue 父组件调用
defineExpose({
  replaceWithTemplate,
  getJSON,
  getText,
  getHTML,
  clearContent,
  focus,
  blur,
  insert,
  resetFocus,
  getTextWithPlaceholders,
})

onMounted(() => { })

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value?.commands.clearContent()
    editor.value.destroy()
  }
})
</script>

<style lang="scss">
.tiptap {
  line-height: 28px;

  .mention {
    background-color: rgb(var(--primary-1));
    border-radius: 6px;
    box-decoration-break: clone;
    color: rgb(var(--primary-6));
    padding: 5px 8px;
  }

  .tt-p {
    line-height: 30px;
  }

  .tt-variable-tag {
    position: relative;
    display: inline-block;

    // background-color: #f0f8ff;
    // padding: 2px 6px;
    // border: 1px solid #c0d8f0;
    // vertical-align: middle;
    border-radius: 6px;
    padding: 0px 8px;
    background: rgba(108, 44, 255, 0.06);
    margin: 1px 2px;
    line-height: 28px;
    box-sizing: border-box;
  }

  .tt-var-value {
    // min-width: 20px;
    display: inline-block;
    position: relative;
    z-index: 2;
    background: transparent;
    cursor: text;
    caret-color: auto;
    /* 确保光标颜色正常 */
    outline: none;
    /* 移除默认轮廓 */
    color: rgb(var(--primary-6));
    line-height: inherit; // 跟随行高，保证
    word-break: break-word;

    /* 确保可编辑状态 */
    &:focus {
      cursor: text;
      caret-color: rgb(var(--primary-6));
      /* 明确设置光标颜色 */
    }

    /* 空内容时确保有高度和宽度供光标显示 */
    &:empty {
      min-width: 2px; // 保留最小可点区域
      min-height: 0; // 取消原来的 28px，避
    }

    &:empty::before {
      content: '\200b'; // 零宽空格（仅渲染，不进 DOM/数据）
      display: inline-block;
      height: 28px;
      line-height: 28px; // 让 caret 垂直居中
      width: 0; // 不占宽
    }

    &[contenteditable='true'] {
      cursor: text;
      caret-color: #333;
    }
  }

  .tt-var-ph {
    position: absolute;
    top: 0px;
    left: 6px;
    color: #ddc2ff;
    pointer-events: auto;
    cursor: text;
    z-index: 1;
    background: transparent;
  }

  /* 空状态下的样式 */
  .tt-variable-tag.is-empty .tt-var-value {
    min-height: 1em;
    /* 确保有可点击区域 */
  }

  /* 聚焦状态 */
  .tt-variable-tag:focus-within {
    outline: 2px solid #4d90fe;
    box-shadow: 0 0 3px rgba(77, 144, 254, 0.5);
  }
}

.chat-editor {
  outline: none;
  box-shadow: none;

  &:focus {
    outline: none;
    border-color: #409eff; // 例如 Arco/Vue 默认主题蓝
  }

  // Placeholder 样式
  p.is-empty::before {
    content: attr(data-placeholder);
    color: #999;
    float: left;
    height: 0;
    pointer-events: none;
  }
}
</style>
<style>
/* 为零宽占位符添加最小间距，确保光标可见 */
.ProseMirror span:has-text('\uFEFF') {
  padding-left: 0.1px;
}

/* 如果浏览器不支持 :has-text，使用属性选择器 */
.ProseMirror span[data-zero-width] {
  padding-left: 0.1px;
}
</style>
