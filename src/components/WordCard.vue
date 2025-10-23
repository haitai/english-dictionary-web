<template>
  <div class="flip-card" :class="{ 'flipped': isFlipped }">
    <div class="flip-card-inner">
      <!-- 正面：单词 -->
      <div class="flip-card-front">
        <div class="card min-h-[400px] flex flex-col items-center justify-center">
          <h2 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {{ word }}
          </h2>
          
          <button
            @click="isFlipped = true"
            class="mt-8 btn btn-primary"
          >
            查看释义
          </button>

          <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            点击查看释义，或按空格键翻转
          </div>
        </div>
      </div>

      <!-- 背面：释义 -->
      <div class="flip-card-back">
        <div class="card min-h-[400px] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {{ wordData?.word }}
              </h2>
              <p v-if="wordData?.pronunciation" class="text-gray-600 dark:text-gray-400 mt-1">
                [{{ wordData.pronunciation }}]
              </p>
            </div>
            <button
              @click="isFlipped = false"
              class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              ❌
            </button>
          </div>

          <!-- 简明释义 -->
          <div class="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p class="text-gray-800 dark:text-gray-200">
              {{ wordData?.concise_definition }}
            </p>
          </div>

          <!-- 详细释义 -->
          <div v-if="wordData?.definitions" class="space-y-4">
            <div
              v-for="(def, index) in wordData.definitions"
              :key="index"
              class="border-l-4 border-primary-500 pl-4"
            >
              <div class="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                {{ def.pos }}
              </div>
              <p class="text-gray-700 dark:text-gray-300 mb-2">
                {{ def.explanation_cn }}
              </p>
              <div class="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded">
                <p class="text-gray-600 dark:text-gray-400 mb-1">{{ def.example_en }}</p>
                <p class="text-gray-700 dark:text-gray-300">{{ def.example_cn }}</p>
              </div>
            </div>
          </div>

          <button
            @click="isFlipped = false"
            class="mt-6 w-full btn btn-secondary"
          >
            返回
          </button>
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

