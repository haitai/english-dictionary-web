<template>
  <div class="flip-card" :class="{ 'flipped': isFlipped }">
    <div class="flip-card-inner">
      <!-- 正面：单词 -->
      <div class="flip-card-front">
        <div class="card min-h-[350px] md:min-h-[400px] flex flex-col items-center justify-center relative">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 md:mb-8 text-center px-4">
            {{ word }}
          </h2>
          
          <button
            @click="isFlipped = true"
            class="btn btn-primary text-base md:text-lg px-6 md:px-8 py-2 md:py-3"
          >
            查看释义
          </button>

          <div class="mt-4 md:mt-6 text-xs md:text-sm text-gray-500 dark:text-gray-400 text-center px-4">
            点击查看释义，或按空格键翻转
          </div>
        </div>
      </div>

      <!-- 背面：释义 -->
      <div class="flip-card-back">
        <div class="card word-detail-card">
          <!-- 紧凑头部 -->
          <div class="word-header">
            <div class="flex items-center justify-center gap-3">
              <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ wordData?.word }}
              </h2>
              <SpeakerButton 
                :text="wordData?.word || ''"
                :lang="'en'"
                :speed="0.8"
              />
            </div>
            <div v-if="currentPhonetic || phoneticLoading" class="mt-1 text-center">
              <div v-if="phoneticLoading" class="text-gray-500 dark:text-gray-400 text-sm">
                <div class="inline-flex items-center gap-1">
                  <div class="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  获取音标中...
                </div>
              </div>
              <p v-else-if="currentPhonetic" class="text-gray-600 dark:text-gray-400 text-sm md:text-base">
                [{{ currentPhonetic }}]
              </p>
            </div>
          </div>

          <!-- 可滚动内容区域 -->
          <div class="word-content">
            <!-- 简明释义 -->
            <div v-if="wordData?.concise_definition" class="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <h3 class="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">简明释义</h3>
              <p class="text-gray-800 dark:text-gray-200 text-sm md:text-base leading-relaxed">
                {{ wordData.concise_definition }}
              </p>
            </div>

            <!-- 详细释义 -->
            <div v-if="wordData?.definitions && wordData.definitions.length > 0" class="space-y-3">
              <h3 class="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">详细释义</h3>
              <div
                v-for="(def, index) in wordData.definitions"
                :key="index"
                class="border-l-4 border-primary-500 pl-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-r-lg"
              >
                <div class="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-2">
                  {{ def.pos }}
                </div>
                <p class="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed text-xs md:text-sm">
                  {{ def.explanation_cn }}
                </p>
                <div v-if="def.example_en" class="text-xs bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg border border-gray-200 dark:border-gray-600 mt-2">
                  <p class="text-gray-600 dark:text-gray-400 mb-1 italic leading-snug" v-html="highlightWord(def.example_en, wordData?.word)"></p>
                  <p class="text-gray-700 dark:text-gray-300 leading-snug" v-html="highlightWord(def.example_cn, wordData?.word)"></p>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="word-footer">
            <button
              @click="isFlipped = false"
              class="w-full btn btn-secondary text-xs md:text-sm py-2"
            >
              返回单词 (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import SpeakerButton from './SpeakerButton.vue'
import { getPhonetic } from '@/utils/phonetic'

const props = defineProps({
  word: {
    type: String,
    required: true
  },
  wordData: {
    type: Object,
    default: null
  }
})

const isFlipped = ref(false)
const currentPhonetic = ref('')
const phoneticLoading = ref(false)

// 高亮单词功能
function highlightWord(text, word) {
  if (!text || !word) return text
  
  // 创建不区分大小写的正则表达式
  const regex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi')
  
  return text.replace(regex, '<span class="highlight-word">$1</span>')
}

// 获取音标
async function fetchPhonetic() {
  if (!props.word) return
  
  phoneticLoading.value = true
  
  try {
    const phonetic = await getPhonetic(props.word, props.wordData?.pronunciation)
    currentPhonetic.value = phonetic || ''
  } catch (error) {
    console.warn('获取音标失败:', error)
    currentPhonetic.value = props.wordData?.pronunciation || ''
  } finally {
    phoneticLoading.value = false
  }
}

// 键盘事件处理
function handleKeyPress(e) {
  if (e.code === 'Space') {
    e.preventDefault()
    isFlipped.value = !isFlipped.value
  } else if (e.code === 'Escape' && isFlipped.value) {
    e.preventDefault()
    isFlipped.value = false
  }
}

// 监听单词变化，重置翻转状态并获取音标
watch(() => props.word, () => {
  isFlipped.value = false
  fetchPhonetic()
})

// 监听单词数据变化，获取音标
watch(() => props.wordData, () => {
  if (props.wordData) {
    fetchPhonetic()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
  // 初始获取音标
  if (props.word) {
    fetchPhonetic()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.flip-card {
  background-color: transparent;
  width: 100%;
  min-height: 350px;
  max-height: 500px;
  height: 500px;
  perspective: 1000px;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .flip-card {
    min-height: 400px;
    max-height: 600px;
    height: 600px;
    margin-bottom: 3rem;
  }
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front, .flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}

/* 确保卡片在翻转时保持正确的高度 */
.flip-card-front .card,
.flip-card-back .card {
  height: 100%;
}

/* 单词详情卡片布局 */
.word-detail-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
  min-height: 500px;
}

@media (min-width: 768px) {
  .word-detail-card {
    min-height: 600px;
  }
}

/* 头部样式 */
.word-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background-color: white;
}

.dark .word-header {
  border-bottom-color: #374151;
  background-color: #1f2937;
}

/* 内容区域 */
.word-content {
  overflow-y: auto;
  padding: 16px;
  min-height: 0;
}

/* 底部按钮 */
.word-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background-color: white;
}

.dark .word-footer {
  border-top-color: #374151;
  background-color: #1f2937;
}

/* 高亮单词样式 */
.highlight-word {
  background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
  color: #1f2937;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.dark .highlight-word {
  background: linear-gradient(120deg, #fbbf24 0%, #f59e0b 100%);
  color: #111827;
}

/* 自定义滚动条样式 */
.word-content::-webkit-scrollbar {
  width: 6px;
}

.word-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.word-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.word-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .word-content::-webkit-scrollbar-track {
  background: #374151;
}

.dark .word-content::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .word-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>

