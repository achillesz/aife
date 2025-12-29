<template>
    <component
        class="chat-box-wrap"
        :is="tag"
        :contenteditable="contenteditable"
        @input="onInput"
        @blur="throttledUpdate"
        @paste="onPaste"
        @keydown="onKeydown"
        @compositionstart="onCompositionStart"
        @compositionend="onCompositionEnd"
        ref="element"
    >
    </component>
</template>

<script setup lang="ts">
import { defineProps, ref, computed, onMounted, watch, defineExpose } from 'vue'
import type { PropType } from 'vue'
import { throttle, isEqual, cloneDeep } from 'lodash'
import { insertTextWithBreaks, stripBrackets, replaceAll } from './help'

const props = defineProps({
    tag: String,
    contenteditable: {
        type: [Boolean, String],
        default: true
    },
    modelValue: {
        type: Array as PropType<
            Array<{
                type: 'tag' | 'text'
                value: string // 变量名，如 dailyReport_result
                tagType?: 'var'
                defaultText?: string
                placeholder?: string
            }>
        >,
        default: () => []
    },
    noHtml: {
        type: Boolean,
        default: true
    },
    noNl: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits({
    returned: String,
    'update:modelValue': String,
    composition: Boolean
})

function onInput() {
    if (isComposing.value) return

    // const nodes = element.value?.querySelectorAll('.var-container')
    // nodes?.forEach((node) => {
    //     const inputText = node.querySelector('.input-text')
    //     const placeholder = node.querySelector('.placeholder')
    //     if (!inputText || !placeholder) return
    //     if (inputText.textContent?.trim()) {
    //         placeholder.classList.add('hidden')
    //     } else {
    //         placeholder.classList.remove('hidden')
    //     }
    // })
    throttledUpdate()
}

const isComposing = ref(false)

function onCompositionStart() {
    isComposing.value = true
    emit('composition', true)
}

function onCompositionEnd() {
    isComposing.value = false
    emit('composition', false)

    throttledUpdate() // composition 结束后再执行更新
}

const element = ref<HTMLElement | null>()

// function currentContent() {
//     return props.noHtml ? element.value!.innerText : element.value!.innerHTML
// }

const getMessage = () => {
    const text = element.value?.innerText || ''
    return text.replace(/\u200B/g, '').trim()
}

defineExpose({
    getMessage
})

// 数据结构提取

function currentContent(): typeof props.modelValue {
    const result: any[] = []
    const nodes = element.value?.childNodes || []

    nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue
            if (text?.trim()) {
                result.push({ type: 'text', value: text })
            }
        } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node as HTMLElement).classList.contains('var-container')
        ) {
            const wrapper = node as HTMLElement
            const inputText = wrapper.querySelector('.input-text') as HTMLElement
            const placeholder = wrapper.querySelector('.placeholder') as HTMLElement

            result.push({
                type: 'tag',
                value: wrapper.dataset.value || '',
                tagType: wrapper.dataset.type || 'var',
                defaultText: inputText?.textContent?.trim() || '',
                placeholder: placeholder?.textContent || ''
            })
        }
    })

    return result
}

function moveCursorToEnd(el: HTMLElement) {
    const range = document.createRange()
    const sel = window.getSelection()

    range.selectNodeContents(el)
    range.collapse(false) // false = 光标移动到内容末尾
    sel?.removeAllRanges()
    sel?.addRange(range)
}

// ui 渲染
function updateContent(content: typeof props.modelValue) {
    if (!element.value) return
    element.value.innerHTML = ''

    content.forEach((block) => {
        if (block.type === 'text') {
            insertTextWithBreaks(element.value!, block.value)
        } else if (block.type === 'tag') {
            const wrapper = document.createElement('span')
            wrapper.className = 'var-container'
            wrapper.contentEditable = 'true'
            wrapper.dataset.value = block.value
            wrapper.dataset.type = block.tagType || 'var'
            // const charWidth = 14
            // const padding = 8
            // const placeholderLength = block.placeholder?.length || 0

            // wrapper.style.minWidth = placeholderLength * charWidth + padding - 14 + 'px'

            // ① placeholder 容器
            const startPoint = document.createElement('div')
            startPoint.className = 'start-point'
            startPoint.contentEditable = 'false'

            const placeholderDiv = document.createElement('div')
            placeholderDiv.className = 'placeholder'

            if (block.defaultText?.trim()) {
                placeholderDiv.classList.add('hidden') // 有 defaultText，隐藏 placeholder
            }
            placeholderDiv.textContent = block.placeholder || ''
            startPoint.appendChild(placeholderDiv)

            // ② 左 padding
            const leftPad = document.createElement('span')
            leftPad.contentEditable = 'false'
            leftPad.style.fontSize = '0px'
            leftPad.innerHTML = '&nbsp;'

            // ③ 用户输入内容
            const userText = document.createElement('span')
            userText.className = 'input-text'
            userText.textContent = block.defaultText || stripBrackets(block.placeholder || '') || ''

            // ④ 右 padding
            const rightPad = document.createElement('span')
            rightPad.contentEditable = 'false'
            rightPad.style.fontSize = '0px'
            rightPad.innerHTML = '&nbsp;'

            // wrapper.appendChild(startPoint)
            // wrapper.appendChild(leftPad)
            wrapper.appendChild(userText)
            // wrapper.appendChild(rightPad)

            element.value!.appendChild(wrapper)
            element.value!.appendChild(document.createTextNode('\u00A0')) // 保证换行后有空格
        }
    })

    moveCursorToEnd(element.value!)
}

// function updateContent(newcontent: string) {
//     if (props.noHtml) {
//         element.value!.innerText = newcontent
//     } else {
//         element.value!.innerHTML = newcontent
//     }
// }

function update() {
    emit('update:modelValue', currentContent())
}

// 不断的提取数据结构抛出
const throttledUpdate = throttle(
    () => {
        update()
    },
    300,
    {
        // leading: true, // 不要立即执行
        trailing: true // 停下来 2 秒后再执行一次
    }
)

function onPaste(event: any) {
    event.preventDefault()
    let text = (event.originalEvent || event).clipboardData.getData('text/plain')
    if (props.noNl) {
        text = replaceAll(text, '\r\n', ' ')
        text = replaceAll(text, '\n', ' ')
        text = replaceAll(text, '\r', ' ')
    }
    window.document.execCommand('insertText', false, text)
}
function onKeydown(event: any) {
    if (event.key == 'Enter' && props.noNl) {
        if (event.shiftKey) {
        } else {
            event.preventDefault()
            if (!event.isComposing) {
                emit('returned', currentContent())
            }
        }
    }
}

onMounted(() => {
    updateContent(props.modelValue ?? [])
})

watch(
    () => props.modelValue,
    (newval, oldval) => {
        if (!isEqual(newval, currentContent())) {
            updateContent(newval ?? [])
        }
    }
)

// watch(
//     () => props.noHtml,
//     (newval, oldval) => {
//         updateContent(props.modelValue ?? '')
//     }
// )

// watch(
//     () => props.tag,
//     (newval, oldval) => {
//         updateContent(props.modelValue ?? '')
//     },
//     { flush: 'post' }
// )
</script>

<style lang="scss">
.chat-box-wrap {
    line-height: 28px;
    .var-container {
        display: inline-block;
        align-items: center;
        border-radius: 6px;
        padding: 0px 8px;
        background: rgba(108, 44, 255, 0.06);

        margin: 1px 2px;
        min-width: 1em;
        height: 28px;
        line-height: 28px;
        box-sizing: border-box;
    }

    .start-point {
        pointer-events: none;
        user-select: none;
        width: 0;
        height: 0;
        white-space: nowrap;
        position: relative;
        overflow: visible;
        /* overflow: hidden; */
    }

    .placeholder {
        /* color: #aaa; */

        /* left: 0;
    opacity: 0.3;
    pointer-events: none;
    position: absolute;
    top: 0; */
    }

    .placeholder.hidden {
        visibility: hidden;
    }

    .input-text {
        outline: none;
        min-width: 1px;
        color: rgb(var(--primary-6));
    }
}
</style>
