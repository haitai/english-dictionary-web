<template>
  <button
    @click="handleSpeak"
    :disabled="isLoading"
    :class="[
      'speaker-button',
      'p-2 rounded-full transition-all duration-200',
      'hover:bg-gray-100 dark:hover:bg-gray-700',
      'focus:outline-none focus:ring-2 focus:ring-primary-500',
      isLoading && 'animate-pulse',
      isPlaying && 'bg-primary-100 dark:bg-primary-900/30'
    ]"
    :title="isPlaying ? '停止发音' : '播放发音'"
  >
    <div class="relative">
      <!-- 播放图标 -->
      <svg
        v-if="!isPlaying"
        class="w-5 h-5 text-gray-600 dark:text-gray-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M8 5v14l11-7z"/>
      </svg>
      
      <!-- 停止图标 -->
      <svg
        v-else
        class="w-5 h-5 text-primary-600 dark:text-primary-400"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M6 6h12v12H6z"/>
      </svg>
      
      <!-- 加载动画 -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { speakText, stopSpeaking, isSpeaking } from '@/utils/tts'

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  lang: {
    type: String,
    default: 'en'
  },
  speed: {
    type: Number,
    default: 1.0
  }
})

const isLoading = ref(false)
const isPlaying = ref(false)

// 监听播放状态
let statusCheckInterval = null

onMounted(() => {
  // 定期检查播放状态
  statusCheckInterval = setInterval(() => {
    isPlaying.value = isSpeaking()
  }, 100)
})

onUnmounted(() => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
  }
  // 组件卸载时停止播放
  stopSpeaking()
})

async function handleSpeak() {
  if (isPlaying.value) {
    // 如果正在播放，则停止
    stopSpeaking()
    isPlaying.value = false
    return
  }

  if (!props.text) {
    console.warn('没有要播放的文本')
    return
  }

  isLoading.value = true
  
  try {
    const success = await speakText(props.text, props.lang, props.speed)
    if (success) {
      isPlaying.value = true
    } else {
      console.error('发音播放失败')
    }
  } catch (error) {
    console.error('发音播放出错:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.speaker-button {
  min-width: 2rem;
  min-height: 2rem;
}

.speaker-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
