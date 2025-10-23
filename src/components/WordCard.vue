<template>
  <div class="flip-card" :class="{ 'flipped': isFlipped }">
    <div class="flip-card-inner">
      <!-- 正面：单词 -->
      <div class="flip-card-front">
        <div class="card min-h-[400px] flex flex-col items-center justify-center relative">
          <h2 class="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            {{ word }}
          </h2>
          
          <button
            @click="isFlipped = true"
            class="btn btn-primary text-lg px-8 py-3"
          >
            查看释义
          </button>

          <div class="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            点击查看释义，或按空格键翻转
          </div>
        </div>
      </div>

      <!-- 背面：释义 -->
      <div class="flip-card-back">
        <div class="card min-h-[400px] flex flex-col">
          <!-- 固定头部 -->
          <div class="flex items-center justify-between mb-6 bg-white dark:bg-gray-800 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {{ wordData?.word }}
              </h2>
              <p v-if="wordData?.pronunciation" class="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                [{{ wordData.pronunciation }}]
              </p>
            </div>
            <button
              @click="isFlipped = false"
              class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="返回"
            >
              <span class="text-xl">↩️</span>
            </button>
          </div>

          <!-- 可滚动内容区域 -->
          <div class="flex-1 overflow-y-auto px-1">
            <!-- 简明释义 -->
            <div v-if="wordData?.concise_definition" class="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
              <h3 class="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">简明释义</h3>
              <p class="text-gray-800 dark:text-gray-200 text-lg leading-relaxed">
                {{ wordData.concise_definition }}
              </p>
            </div>

            <!-- 详细释义 -->
            <div v-if="wordData?.definitions && wordData.definitions.length > 0" class="space-y-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">详细释义</h3>
              <div
                v-for="(def, index) in wordData.definitions"
                :key="index"
                class="border-l-4 border-primary-500 pl-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-r-xl"
              >
                <div class="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-3">
                  {{ def.pos }}
                </div>
                <p class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                  {{ def.explanation_cn }}
                </p>
                <div v-if="def.example_en" class="text-sm bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p class="text-gray-600 dark:text-gray-400 mb-2 italic" v-html="highlightWord(def.example_en, wordData?.word)"></p>
                  <p class="text-gray-700 dark:text-gray-300" v-html="highlightWord(def.example_cn, wordData?.word)"></p>
                </div>
              </div>
            </div>
          </div>

          <!-- 固定底部按钮 -->
          <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <button
              @click="isFlipped = false"
              class="w-full btn btn-secondary text-lg py-3"
            >
              返回单词
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

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

// 高亮单词功能
function highlightWord(text, word) {
  if (!text || !word) return text
  
  // 创建不区分大小写的正则表达式
  const regex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi')
  
  return text.replace(regex, '<span class="highlight-word">$1</span>')
}

// 键盘事件处理
function handleKeyPress(e) {
  if (e.code === 'Space') {
    e.preventDefault()
    isFlipped.value = !isFlipped.value
  }
}

// 监听单词变化，重置翻转状态
watch(() => props.word, () => {
  isFlipped.value = false
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
.flip-card {
  background-color: transparent;
  width: 100%;
  height: 400px;
  perspective: 1000px;
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
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>

