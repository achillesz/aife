<template>
  <icon-font1 :style="styleObj" :type="type" :size="size" :spin="spin" :rotate="rotate" />
</template>

<script>
import { Icon } from '@arco-design/web-vue'
//   import ArcoVue from '@arco-design/web-vue'

const IconFont1 = Icon.addFromIconFontCn({
  src: '//at.alicdn.com/t/c/font_4900790_kd3kmwxysfp.js',
})

export default {
  name: 'IconFont',
  props: {
    styleObj: {
      type: Object,
      default: () => ({}),
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: [String, Number],
      default: 16,
    },
    rotate: {
      type: Number,
      default: 0,
    },
    spin: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    IconFont1,
  },
}
</script>
