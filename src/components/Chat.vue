<template>
  <div
    class="chat-outer"
    ref="chatComponentRef"
  >
    <a-scrollbar :style="{ maxHeight: maxHeight, overflowY: 'auto' }">
      <tiptap
        ref="editEle"
        v-model:isFocused="isFocused"
        v-model="messageData"
        :placeholder="placeholder"
        @submit="handleSubmit"
      />
    </a-scrollbar>
    <div class="controls">
      <div class="leftControls">
        <div class="infoSource">
          <slot name="infoSource"></slot>
        </div>
        <div class="model">
          <slot name="model"></slot>
        </div>

        <div class="net">
          <slot name="net"></slot>
        </div>
        <div class="model">
          <slot name="thinkMode"></slot>
        </div>
      </div>
      <div class="rightConrols">
        <slot name="clear"></slot>
        <slot name="upload">
        </slot>
        <div class="submit">
          <template v-if="loading">
            <a-tooltip
              content="停止问答"
              position="top"
            >
              <span
                class="stop"
                @click="emit('stop')"
              >
                <span></span>
              </span>
            </a-tooltip>
          </template>
          <span
            @click="handleSubmit"
            v-else-if="message.trim() !== ''"
          >
            <IconFont
              :fill="'#4c4cf1'"
              type="icon-a-send"
              size="32"
            />
          </span>
          <span
            v-else
            class="disableClick"
          >
            <IconFont
              :fill="'#d9d7fc'"
              type="icon-a-send"
              size="32"
            />
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>

import { ref, onMounted } from 'vue'

const emit = defineEmits(['stop', 'submit', 'selectMenu'])

const props = defineProps({
  disabledAttachment: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '输入你的问题，Enter键发送，Shift+Enter换行',
  },
  conversationId: {
    type: String,
    default: '',
  },
  hasImage: {
    type: Boolean,
    default: false,
  },
  filesList: {
    type: Array,
    default: () => {
      return []
    },
  },
  scene: {
    type: String,
    default: '', // assistant
  },
})

const editEle = ref(null)
const isFocused = ref(false)
const message = ref('')
const messageData = ref({ type: 'doc', content: [] }) // 导出下面这个方法，给父组件调用 vue setup 中使用
const updateMessage = val => {
  messageData.value = val
  editEle.value?.resetFocus()
}

const maxHeight = ref('144px')
const uploadFiles = ref([])

const chatComponentRef = ref(null)



const handleSubmit = () => {
  console.log('提交的消息内容:', messageData.value)
  if (message.value.trim() === '') return

  emit('submit', message.value, uploadFiles.value, true)
  editEle.value?.focus()

}

onMounted(() => {
  try {
    console.log('Component mounted')

    // props.scene !== 'assistant' &&
    //   props.scene !== 'bottomChat' &&
    //   updateMessage(dashBoardStore.currentDashBoard?.questConfig.messageData || [])

    let ele = editEle?.value?.$el

    // console.log(editEle.value.$el, 'dom.....')
    // 监听输入框的变化
    ele.addEventListener('keydown', event => {
      if (event.key === 'Backspace') {
        setTimeout(() => {
          // bug 删除完后 里面会有一个 <br> 的标签
          // console.log(ele.innerHTML, 'ele.innerHTML')
          if (ele.innerHTML === '<br>' || ele.innerHTML.trim() === '<br>') {
            message.value = ''
          }
        }, 0)
      }
    })

    // resizeObserverChat = new ResizeObserver(entries => {
    //   for (let entry of entries) {
    //     const width = entry.contentRect.width
    //     if (width < 460) {
    //       isWrapControl.value = true
    //     } else {
    //       isWrapControl.value = false
    //     }
    //   }
    // })

    // resizeObserver = new ResizeObserver(entries => {
    //   for (let entry of entries) {
    //     const height = entry.contentRect.height

    //     if (height > 60) {
    //       previerAreaIsTwoLine.value = true
    //     } else {
    //       previerAreaIsTwoLine.value = false
    //     }

    //   }
    // })

    // if (previewBoxRef.value) {
    //   resizeObserver.observe(previewBoxRef.value)
    // }

    // if (chatComponentRef.value) {
    //   resizeObserverChat.observe(chatComponentRef.value)
    // }
  } catch (e) {
    console.log(e)
  }
})




</script>
<style scoped lang="scss">
.chat-outer {
  container-type: inline-size;
  width: 100%;
  min-height: 136px;
  max-height: 200px;
  box-sizing: border-box;
  background: var(--color-bg-card);
  box-shadow: 0px 4px 20px 0px var(--chat-shadow-color, rgba(84, 75, 211, 0.12));
  border-radius: 16px;
  border: 1px solid var(--color-border);
  position: relative;
  padding: 16px 10px 47px 10px;
  transition:
    box-shadow 0.2s ease-in-out,
    background-color 0.2s ease,
    border-color 0.2s ease;

  &.focused {
    box-shadow: 0px 0px 10px 0px var(--chat-focused-shadow, rgba(102, 126, 234, 0.3));
    border-radius: 16px;
    border: 1px solid transparent;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-image: linear-gradient(to right, var(--color-bg-card), var(--color-bg-card)),
      var(--km-focused-gradient);
  }

  .controls {
    position: absolute;
    bottom: 12px;
    left: 16px;
    right: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .leftControls {
      display: flex;
      align-items: center;
      gap: 12px;

      .infoSource,
      .model,
      .net {
        display: flex;
        align-items: center;
      }
    }

    .rightControls {
      display: flex;
      align-items: center;
      gap: 12px;

      .submit {
        cursor: pointer;

        .disableClick {
          cursor: not-allowed;
        }

        .stop {
          display: inline-block;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #f5222d;
          position: relative;

          span {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            background-color: #fff;
            border-radius: 2px;
          }
        }
      }
    }
  }
}

// 暗色主题适配
:global(body[arco-theme='dark']) .chat-outer {
  --chat-shadow-color: rgba(0, 0, 0, 0.3);
  --chat-focused-shadow: rgba(102, 126, 234, 0.4);
}
</style>
