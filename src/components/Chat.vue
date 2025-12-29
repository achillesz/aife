<template>
  <div class="chat-outer">
    <a-scrollbar :style="{ maxHeight: maxHeight, overflowY: 'auto' }">
      <tiptap
        ref="editEle"
        v-model:isFocused="isFocused"
        v-model="messageData"
        :placeholder="placeholder"
        @submit="handleSubmit"
      />
    </a-scrollbar>
  </div>
</template>
<script setup>

import { ref, computed } from 'vue'


const editEle = ref(null)
const isFocused = ref(false)
const messageData = ref([])
const placeholder = '请输入消息内容...'


const handleSubmit = () => {
  console.log('提交的消息内容:', messageData.value)
  // 提交后清空输入框
  messageData.value = ''
  // 重新聚焦输入框
  isFocused.value = true
}

</script>
<style scoped lang="scss">
.chat-outer {
  container-type: inline-size;
  width: 100%;
  min-height: 136px;
  box-sizing: border-box;
  background: var(--color-bg-card);
  box-shadow: 0px 4px 20px 0px var(--chat-shadow-color, rgba(84, 75, 211, 0.12));
  border-radius: 16px;
  border: 1px solid var(--color-border);
  position: relative;
  padding: 16px 10px 62px 10px;
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
}

// 暗色主题适配
:global(body[arco-theme='dark']) .chat-outer {
  --chat-shadow-color: rgba(0, 0, 0, 0.3);
  --chat-focused-shadow: rgba(102, 126, 234, 0.4);
}
</style>
