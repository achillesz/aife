import { Node as TiptapNode, mergeAttributes } from '@tiptap/core'
import { TextSelection } from 'prosemirror-state'
import type { ViewMutationRecord } from 'prosemirror-view'
import { Fragment } from 'prosemirror-model' // 修复：用于正确构造粘贴时的内容 Fragment

export interface VariableTagOptions {
  HTMLAttributes: Record<string, any>
}

export interface InsertVariablePayload {
  name: string
  defaultText?: string
  placeholder?: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    variableTag: {
      /** 插入一个变量标签 */
      insertVariableTag: (attrs: InsertVariablePayload) => ReturnType
      /** 切换占位符显隐（通常不需要手动调用，NodeView 会自动处理） */
      toggleVariablePlaceholder: (pos?: number) => ReturnType
    }
  }
}

export const VariableTag = TiptapNode.create<VariableTagOptions>({
  name: 'variableTag',
  inline: true,
  group: 'inline',
  atom: false, // 需要有可编辑内容，因此不设为 atom
  selectable: true,
  draggable: false,
  content: 'text*', // 保存 defaultText 文本
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'tt-variable-tag',
      },
    }
  },
  addAttributes() {
    return {
      name: {
        default: '',
        parseHTML: el => (el as HTMLElement).getAttribute('data-name') || '',
        renderHTML: attrs => ({ 'data-name': attrs.name }),
      },
      placeholder: {
        default: '',
        parseHTML: el => (el as HTMLElement).getAttribute('data-placeholder') || '',
        renderHTML: attrs => ({ 'data-placeholder': attrs.placeholder }),
      },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'span[data-type="variable-tag"]',
        contentElement: '.tt-var-value',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    // console.log('renderHTML - 正在渲染节点:', node)
    // console.log('renderHTML - 节点内容:', node.textContent)
    // console.log('renderHTML - 节点内容大小:', node.content.size)
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'variable-tag',
      }),

      ['span', { class: 'tt-var-value' }, 0],
      // ['span', { class: 'tt-var-ph', contenteditable: 'false' }, node.attrs.placeholder]
    ]
  },

  addCommands() {
    return {
      insertVariableTag:
        ({ name, defaultText = '', placeholder = '' }: InsertVariablePayload) =>
        ({ chain, state }) => {
          const nodeType = this.type
          return chain()
            .insertContent({
              type: nodeType.name,
              attrs: { name, placeholder, defaultText },
              content: [
                {
                  type: 'text',
                  text: name || defaultText,
                },
              ],
            })
            .command(({ tr }) => {
              // 将光标放到 value 内部末尾
              const { doc, selection } = tr
              const pos = selection.$from.pos
              const nodeAfter = doc.nodeAt(pos - 1)
              if (nodeAfter && nodeAfter.type === nodeType) {
                // 进入该节点的最后一个字符
                // 进入该节点的最后
                const end = pos // 简化处理（链式 insert 后光标已在节点后面）
                // tr.setSelection(
                //     state.selection.constructor?.near?.(tr.doc.resolve(end - 1))
                // )
              }
              return true
            })
            .run()
        },

      toggleVariablePlaceholder:
        () =>
        ({ tr }) => {
          // 由 NodeView 自动根据是否有文本来控制，无需实现
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      ArrowRight: ({ editor }) => {
        const { state, view } = editor
        const { selection } = state

        // 仅处理空光标（非选区）
        if (!(selection instanceof TextSelection) || !selection.empty) return false

        const { $from } = selection

        // 仅当光标在 variableTag 内部时处理
        if ($from.parent.type.name !== this.name) return false

        // 如果光标在节点内容末尾，则将光标移到该内联节点之后
        const atEnd = $from.parentOffset === $from.parent.content.size
        if (atEnd) {
          const posAfter = $from.after()
          const tr = state.tr.setSelection(TextSelection.create(state.doc, posAfter))
          view.dispatch(tr)
          return true // 阻止默认，使用我们的行为
        }

        return false // 非边界，走默认
      },

      ArrowLeft: ({ editor }) => {
        const { state, view } = editor
        const { selection } = state

        if (!(selection instanceof TextSelection) || !selection.empty) return false

        const { $from } = selection

        // 新增：检查是否在 FEFF 占位符上
        if ($from.parent.type.name !== this.name) {
          // 检查光标是否在某个 variableTag 后面的 FEFF 上
          const pos = selection.from
          const charBefore = state.doc.textBetween(Math.max(0, pos - 1), pos)

          if (charBefore === '\uFEFF') {
            // 找到前面的 variableTag 节点
            const $pos = state.doc.resolve(pos - 1)
            const nodeBefore = $pos.nodeBefore

            if (nodeBefore && nodeBefore.type.name === this.name) {
              // 直接跳到标签内部末尾
              const nodeStart = pos - nodeBefore.nodeSize - 1
              const nodeEnd = pos - 1
              const insideEnd = nodeEnd - 1 // 标签内部的末尾位置

              const tr = state.tr.setSelection(TextSelection.create(state.doc, insideEnd))
              view.dispatch(tr)
              return true
            }
          }

          return false
        }

        // 原有逻辑：如果光标在节点内容开头，则将光标移到该内联节点之前
        const atStart = $from.parentOffset === 0
        if (atStart) {
          const posBefore = $from.before()
          const tr = state.tr.setSelection(TextSelection.create(state.doc, posBefore))
          view.dispatch(tr)
          return true
        }

        return false
      },
      Backspace: ({ editor }) => {
        const { state, view } = editor
        const { selection } = state
        const { $from } = selection

        // 如果光标在变量节点内部
        if ($from.parent.type.name === this.name) {
          const text = $from.parent.textContent

          if (text.length === 0) {
            // 已经是空的 → 阻止继续删除节点
            return true // 阻止默认删除节点
          }
        }

        return false // 其他情况走默认
      },
    }
  },

  addNodeView() {
    // 自定义 NodeView 以控制 placeholder 显隐
    // 自定义 NodeView 以控制 placeholder 显隐
    return ({ node, editor, getPos }) => {
      // console.log('addNodeView...............')
      // 容器
      const container = document.createElement('span')
      container.className = 'tt-variable-tag'
      container.setAttribute('data-type', 'variable-tag')

      // 引入 nodeRef，始终引用最新节点
      let nodeRef = node
      // 新增：读取“当前位置的最新节点”的工具函数，避免使用过期的 node 引用
      const readNodeAtPos = () => {
        const view = editor.view
        const pos = typeof getPos === 'function' ? getPos() : null
        if (!view || typeof pos !== 'number') return nodeRef
        // 注意：getPos() 返回的正是该内联节点起始位置
        return view.state.doc.nodeAt(pos) || nodeRef
      }

      // 前占位符（防止光标跑到节点前面）
      const beforeSpacer = document.createElement('span')
      beforeSpacer.contentEditable = 'false'
      beforeSpacer.style.cssText =
        'vertical-align: top; font-size: 0px; user-select: none; pointer-events: none;'
      beforeSpacer.innerHTML = '&nbsp;'

      const contentDOM = document.createElement('span')
      contentDOM.className = 'tt-var-value'
      contentDOM.setAttribute('contenteditable', 'true')
      contentDOM.style.outline = 'none' // 移除默认轮廓
      contentDOM.style.cursor = 'text'
      contentDOM.style.caretColor = '#333' // 明确设置光标颜色

      // 后占位符（防止光标跑到节点后面）
      const afterSpacer = document.createElement('span')
      afterSpacer.contentEditable = 'false'
      afterSpacer.style.cssText =
        'vertical-align: top; font-size: 0px; user-select: none; pointer-events: none;'
      afterSpacer.innerHTML = '&nbsp;'

      // 占位符（不可编辑）
      const phEl = document.createElement('span')
      phEl.classList.add('tt-var-ph')
      phEl.textContent = nodeRef.attrs.placeholder || '请输入'
      phEl.contentEditable = 'false'
      phEl.style.pointerEvents = 'none' // 关键：不拦截点击
      phEl.style.userSelect = 'none'

      // 插入dom
      container.appendChild(phEl)
      container.appendChild(beforeSpacer)
      container.appendChild(contentDOM)
      container.appendChild(afterSpacer)

      // 计算最小宽度的函数
      const measureTextWidth = (text: string) => {
        const tempEl = document.createElement('span')
        tempEl.style.visibility = 'hidden'
        tempEl.style.position = 'absolute'
        tempEl.style.whiteSpace = 'nowrap'
        tempEl.style.font = getComputedStyle(phEl).font // 使用相同字体
        tempEl.textContent = text

        document.body.appendChild(tempEl)
        const width = tempEl.offsetWidth
        document.body.removeChild(tempEl)

        return width + 16 // 添加边距
      }

      // 点击进入：基于“当前最新节点”判断内容与边界
      container.addEventListener('mousedown', e => {
        if ((e as MouseEvent).button !== 0) return
        const target = e.target as Node
        const inContent = target === contentDOM || contentDOM.contains(target)
        const isDouble = (e as MouseEvent).detail >= 2
        if (inContent || isDouble) {
          // 放行：让浏览器/ProseMirror 自己处理双击或 contentDOM 内的选中
          return
        }

        // 仅拦截容器上的“单击”进入标签
        e.preventDefault()
        e.stopPropagation()

        const view = editor.view
        if (!view) return
        const pos = typeof getPos === 'function' ? getPos() : null
        if (typeof pos !== 'number') return

        const currentNode = readNodeAtPos()
        const hasText =
          (currentNode?.textContent || '').trim().length > 0 ||
          (currentNode?.content?.size ?? 0) > 0

        try {
          let targetPos: number
          if (!hasText) {
            targetPos = pos + 1
          } else {
            const coords = {
              left: (e as MouseEvent).clientX,
              top: (e as MouseEvent).clientY,
            }
            const docPos = view.posAtCoords(coords)
            if (docPos) {
              const nodeStart = pos
              const nodeEnd = pos + (currentNode?.nodeSize ?? nodeRef.nodeSize)
              const insideStart = nodeStart + 1
              const insideEnd = nodeEnd - 1
              targetPos = Math.max(insideStart, Math.min(docPos.pos, insideEnd))
            } else {
              targetPos = pos + 1
            }
          }
          const newSelection = TextSelection.create(view.state.doc, targetPos)
          const tr = view.state.tr.setSelection(newSelection)
          view.dispatch(tr)
          view.focus()
          setTimeout(() => contentDOM?.focus(), 0)
        } catch (error) {
          // ... existing code ...
        }
      })

      container.addEventListener('dblclick', e => {
        const target = e.target as Node
        const inContent = target === contentDOM || contentDOM.contains(target)
        if (inContent) return // contentDOM 内双击交给原生/PM 处理
        const view = editor.view
        if (!view) return
        const pos = typeof getPos === 'function' ? getPos() : null
        if (typeof pos !== 'number') return

        const currentNode = readNodeAtPos()
        const nodeStart = pos
        const nodeEnd = pos + (currentNode?.nodeSize ?? nodeRef.nodeSize)
        const insideStart = nodeStart + 1
        const insideEnd = nodeEnd - 1
        if (insideEnd >= insideStart) {
          const tr = view.state.tr.setSelection(
            TextSelection.create(view.state.doc, insideStart, insideEnd)
          )
          view.dispatch(tr)
          view.focus()
        }
      })
      // 刷新占位符与最小宽：优先使用传入节点，否则读取当前最新节点
      const refresh = (n: any) => {
        const currentNode = n ?? readNodeAtPos()
        const hasText =
          (currentNode?.textContent || '').trim().length > 0 ||
          (currentNode?.content?.size ?? 0) > 0
        const placeholderText =
          (currentNode?.attrs?.placeholder as string) || nodeRef.attrs.placeholder || '请输入'
        phEl.textContent = placeholderText

        if (hasText) {
          phEl.style.visibility = 'hidden'
          container.style.minWidth = 'auto'
        } else {
          phEl.style.visibility = 'visible'
          const minWidth = measureTextWidth(placeholderText)
          container.style.minWidth = `${minWidth}px`

          // 当显示占位符时，确保光标在节点内部
          setTimeout(() => {
            const view = editor.view
            if (!view || !view.hasFocus()) return

            const pos = typeof getPos === 'function' ? getPos() : null
            if (typeof pos !== 'number') return

            const { state } = view
            const { selection } = state

            const nodeStart = pos
            const nodeEnd = pos + (currentNode?.nodeSize ?? nodeRef.nodeSize)
            const insideStart = nodeStart + 1

            // 如果光标不在节点内部，将其设置到开始位置
            const isInsideNode = selection.from >= insideStart && selection.to < nodeEnd
            if (!isInsideNode) {
              try {
                const newSelection = TextSelection.create(state.doc, insideStart)
                const tr = state.tr.setSelection(newSelection)
                view.dispatch(tr)
                // console.log('refresh时将光标设置到节点内部')
              } catch (error) {
                console.warn('refresh时设置光标失败:', error)
              }
            }
          }, 10)
        }
      }

      refresh(nodeRef)

      // 参考豆包：在标签后插入零宽占位节点确保光标可见
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Backspace') return

        const view = editor.view
        if (!view) return
        const { state } = view
        const { selection } = state
        if (!selection.empty) return

        const pos = typeof getPos === 'function' ? getPos() : null
        if (typeof pos !== 'number') return

        const nodeStart = pos
        const nodeEnd = pos + nodeRef.nodeSize

        // 只处理一种情况：光标在 FEFF 上，要删除 FEFF+标签
        if (selection.from === nodeEnd + 1) {
          const nextChar = state.doc.textBetween(
            nodeEnd,
            Math.min(nodeEnd + 1, state.doc.content.size)
          )
          if (nextChar === '\uFEFF') {
            e.preventDefault()
            const tr = state.tr.delete(nodeStart, nodeEnd + 1) // 删掉标签和 FEFF
            view.dispatch(tr.setSelection(TextSelection.create(tr.doc, nodeStart)))
            return
          }
        }
      }

      const onKeyUp = (e: KeyboardEvent) => {
        if (e.key !== 'Backspace') return

        const view = editor.view
        if (!view || !view.hasFocus()) return

        const pos = typeof getPos === 'function' ? getPos() : null
        if (typeof pos !== 'number') return

        const { state } = view
        const { selection } = state
        if (!selection.empty) return

        const nodeEnd = pos + nodeRef.nodeSize

        // 检查光标是否刚好在标签后面
        if (selection.from === nodeEnd) {
          const $from = selection.$from
          const atEndOfParent = $from.parentOffset === $from.parent.content.size

          // 只在父节点末尾时处理（即后面没有其他内容）
          if (atEndOfParent) {
            const nextChar = state.doc.textBetween(
              nodeEnd,
              Math.min(nodeEnd + 1, state.doc.content.size)
            )

            // 如果后面没有 FEFF，添加一个
            if (nextChar !== '\uFEFF') {
              try {
                const tr = state.tr.insert(nodeEnd, state.schema.text('\uFEFF'))
                tr.setSelection(TextSelection.create(tr.doc, nodeEnd + 1))
                view.dispatch(tr)
                // console.log('删除后在标签后添加零宽占位符确保光标可见')
              } catch (error) {
                // console.warn('插入零宽占位符失败:', error)
              }
            }
          }
        }
      }

      editor.view?.dom.addEventListener('keydown', onKeyDown)
      editor.view?.dom.addEventListener('keyup', onKeyUp)

      return {
        dom: container,
        contentDOM: contentDOM,
        update: updatedNode => {
          // 节点更新时同步内容
          if (updatedNode.type.name !== nodeRef.type.name) return false
          // 关键：同步最新的 node 引用，避免使用过期 node 导致 hasText 误判
          nodeRef = updatedNode
          // console.log('NodeView.update called')
          refresh(updatedNode)
          return true
        },
        stopEvent: event => {
          if (event.type === 'dblclick') return false // 放行双击，允许原生/PM 选中
          if (event.type === 'mousedown') {
            const target = event.target as Node
            const inContent = contentDOM && (target === contentDOM || contentDOM.contains(target))
            const isDouble = (event as MouseEvent).detail >= 2
            if (inContent || isDouble) return false // 放行
            return true // 拦截容器上的单击，由我们接管定位
          }
          return false // 其他事件放行
        },

        // 关键修复：更宽泛的 ignoreMutation
        // 修复 ignoreMutation 中的类型错误
        ignoreMutation(mutation: ViewMutationRecord) {
          // ViewMutationRecord 可能是选择变更，没有 target 属性
          if (!('target' in mutation)) {
            return true // 忽略选择变更
          }

          const target = mutation.target as Element // 修正类型

          // 忽略对占位元素及其子元素的所有变化
          if (target === phEl || phEl.contains(target)) {
            return true
          }

          // 忽略对容器属性的变化（比如 class, style 等）
          if (target === container && mutation.type === 'attributes') {
            return true
          }

          // contentDOM 的内容变化交给 PM 处理
          if (contentDOM && (target === contentDOM || contentDOM.contains(target))) {
            return false
          }

          return false
        },
        // selectNode() {
        //     container.classList.add('is-selected')
        // },
        // deselectNode() {
        //     container.classList.remove('is-selected')
        // },
        destroy: () => {
          // 清理选择变化监听器
          editor.view?.dom.removeEventListener('keydown', onKeyDown)
          editor.view?.dom.removeEventListener('keyup', onKeyUp)
        },
      }
    }
  },
})
