<template>
  <div>
    <div>
      <a-skeleton>
        <a-space direction="vertical" :style="{ width: '100%' }" size="large">
          <a-skeleton-line :rows="3" />
          <a-skeleton-shape />
        </a-space>
      </a-skeleton>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>
