// Define Property type if not imported
export type Property = {
    value: string
    placeholder?: {
        defaultText?: string
        placeholder?: string
    }
}

import type { PropType } from 'vue'

// ... existing code ...
export function parsePromptTemplateToContentBlocks(
    userPromptTpl: string,
    properties: Property[]
): Array<{ type: 'paragraph'; content?: any[] }> {
    // 兼容字符串中的转义换行
    const tpl = (userPromptTpl || '').replace(/\\n/g, '\n')
    const regex = /\$\{(.*?)\}/g

    const paragraphs: Array<{ type: 'paragraph'; content?: any[] }> = []
    let curPara: any[] = []

    const newParagraph = () => {
        if (curPara.length > 0) {
            paragraphs.push({ type: 'paragraph', content: curPara })
        } else {
            paragraphs.push({ type: 'paragraph' })
        }
        curPara = []
    }

    const emitText = (text: string) => {
        if (text == null || text.length === 0) return
        const lines = text.split('\n')
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            if (line && line.length > 0) {
                curPara.push({ type: 'text', text: line })
            }
            if (i < lines.length - 1) {
                newParagraph()
            }
        }
    }

    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(tpl)) !== null) {
        const varName = match[1]
        const index = match.index

        // 先追加变量前的文本
        if (index > lastIndex) {
            emitText(tpl.slice(lastIndex, index))
        }

        // 找到属性映射
        const prop = properties?.find((p) => p.value === varName)
        const placeholderRaw = prop?.placeholder?.placeholder ?? varName ?? ''
        const placeholder = stripBrackets(String(placeholderRaw))
        const defaultTextRaw = prop?.placeholder?.defaultText ?? ''
        const defaultText = stripBrackets(String(defaultTextRaw))

        // 变量节点（attrs 仅保留 placeholder）
        const varNode: any = {
            type: 'variableTag',
            attrs: {
                placeholder
            },
            content: []
        }
        if (defaultText && defaultText.length > 0) {
            varNode.content.push({ type: 'text', text: defaultText })
        }

        curPara.push(varNode)

        lastIndex = regex.lastIndex
    }

    // 处理尾部文本
    if (lastIndex < tpl.length) {
        emitText(tpl.slice(lastIndex))
    }

    // 收尾：推入最后一段
    newParagraph()

    return paragraphs
}

export function genDefaultEmpty() {
    return [
        {
            type: 'text',
            value: ''
        }
    ]
}

function splitByEscapedNewline(text: string): string[] {
    return text.replace(/\\n/g, '\n').split('\n')
}

export function insertTextWithBreaks(el: HTMLElement, text: string) {
    const lines = splitByEscapedNewline(text)
    lines.forEach((line, index) => {
        el.appendChild(document.createTextNode(line))
        if (index < lines.length - 1) {
            el.appendChild(document.createElement('br'))
        }
    })
}

export function stripBrackets(str: string): string {
    return str.replace(/^\[|\]$/g, '')
}

export function replaceAll(str: string, search: string, replacement: string) {
    return str.split(search).join(replacement)
}

export function isAtEndOfParagraph(editor: any) {
    const { selection } = editor.state
    const { $from } = selection

    // 当前所在的节点
    const parentNode = $from.parent

    // 在该节点中的位置
    const posInParent = $from.parentOffset

    // 判断是否在段落末尾
    const isAtEndOfParagraph = posInParent === parentNode.content.size

    // console.log({
    //     nodeType: parentNode.type.name, // 一般是 'paragraph'
    //     posInParent,
    //     isAtEndOfParagraph
    // })

    return isAtEndOfParagraph
}
