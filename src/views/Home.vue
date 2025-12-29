<template>
  <div class="home flex">
    <div class="header">
      <div class="logo">AIFE</div>
      <a-avatar :style="{ backgroundColor: '#00d0b6' }">Design</a-avatar>
    </div>
    <div class="main">
      <div
        class="home-first"
        v-if="isFirstChat"
      >
        <div>hi Karen</div>
        <div>assistant-messages-primary-container visible-primary-message open</div>
        <div class="chat-area">
          <chat></chat>
        </div>
        <div class="chat-types">
          <div class="chat-type"> ☃️ Create image </div>
          <div class="chat-type"> ❄️ Write anything </div>
          <div class="chat-type"> ❄️ Create video</div>
          <div class="chat-type"> Help me learn </div>
          <div class="chat-type"> Boost my day </div>
        </div>
      </div>
      <div
        class="home-append"
        v-else
      ></div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import Chat from '@/components/Chat.vue'
// const chatId = ref(null)
const isFirstChat = ref(true)
</script>

<style scoped lang="scss">
.home {
  padding: 20px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  .header {
    flex: 0 0 60px
  }

  .main {
    flex: 1 0 auto
  }



  .chat-area {
    flex: 1;
    margin-top: 20px;
    width: 160px;
  }
}
</style>
