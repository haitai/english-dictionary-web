<template>
  <button
    @click="handleSpeak"
    :disabled="isSpeaking"
    class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors duration-200"
    :class="{
      'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600': !isSpeaking,
      'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed': isSpeaking
    }"
    :title="isSpeaking ? '朗读中...' : '朗读句子'"
  >
    <svg
      v-if="!isSpeaking"
      xmlns="http://www.w3.org/2000/svg"
      class="h-3 w-3"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M9.383 2.058a1 1 0 011.234 0l4.25 2.833A1 1 0 0115 6v8a1 1 0 01-.383.792l-4.25 2.833a1 1 0 01-1.234 0L4.75 14.792A1 1 0 014 14V6a1 1 0 01.75-.792l4.633-3.084zM16.5 10a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM16.5 7a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM16.5 13a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5z"
        clip-rule="evenodd"
      />
    </svg>
    <div
      v-else
      class="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
    ></div>
    <span class="hidden sm:inline">{{ isSpeaking ? '朗读中' : '朗读' }}</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { speakSentence } from '@/utils/tts'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  lang: {
    type: String,
    default: 'en-US'
  },
  speed: {
    type: Number,
    default: 0.8
  }
})

const isSpeaking = ref(false)

const handleSpeak = async () => {
  if (isSpeaking.value || !props.text) return
  
  isSpeaking.value = true
  
  try {
    // 延迟执行，确保不阻塞用户交互
    setTimeout(async () => {
      try {
        await speakSentence(props.text, {
          lang: props.lang,
          speed: props.speed
        })
      } catch (error) {
        console.warn('朗读句子失败:', error)
      } finally {
        // 估算播放时间，避免按钮状态异常
        const estimatedTime = Math.max(props.text.length * 50, 1000)
        setTimeout(() => {
          isSpeaking.value = false
        }, estimatedTime)
      }
    }, 50)
  } catch (error) {
    console.warn('朗读句子失败:', error)
    isSpeaking.value = false
  }
}
</script>
