<template>
  <div class="max-w-4xl mx-auto px-4">
    <div class="text-center mb-4 md:mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        学习模式
      </h1>
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
        选择单词开始学习，标记您的掌握程度
      </p>
    </div>

    <!-- 当前单词卡片 -->
    <div v-if="currentWord">
      <!-- 单词卡片容器 -->
      <div class="word-card-wrapper">
        <WordCard :word="currentWord.word" :word-data="currentWord" />
      </div>

      <!-- 掌握程度选择 -->
      <div class="quality-selection">
        <h3 class="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
          您对这个单词的掌握程度是？
        </h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto">
          <button
            v-for="(option, index) in qualityOptions"
            :key="option.value"
            @click="markWord(option.value)"
            :class="[
              'group relative p-4 md:p-6 rounded-lg border-2 transition-all duration-200',
              'hover:scale-105 hover:shadow-lg active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              option.color === 'red' && 'border-red-300 bg-red-50 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 focus:ring-red-500',
              option.color === 'yellow' && 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30 focus:ring-yellow-500',
              option.color === 'green' && 'border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 focus:ring-green-500',
              submitting && 'opacity-50 cursor-not-allowed'
            ]"
            :disabled="submitting"
          >
            <div class="text-center">
              <div :class="[
                'text-xl md:text-2xl mb-2',
                option.color === 'red' && 'text-red-600 dark:text-red-400',
                option.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                option.color === 'green' && 'text-green-600 dark:text-green-400'
              ]">
                {{ option.icon }}
              </div>
              <div :class="[
                'font-semibold text-sm md:text-lg mb-1',
                option.color === 'red' && 'text-red-800 dark:text-red-200',
                option.color === 'yellow' && 'text-yellow-800 dark:text-yellow-200',
                option.color === 'green' && 'text-green-800 dark:text-green-200'
              ]">
                {{ option.label }}
              </div>
              <p :class="[
                'text-xs md:text-sm leading-tight',
                option.color === 'red' && 'text-red-600 dark:text-red-400',
                option.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                option.color === 'green' && 'text-green-600 dark:text-green-400'
              ]">
                {{ option.description }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- 收藏按钮 -->
      <div class="mt-4 md:mt-6 text-center">
        <button
          v-if="userStore.isAuthenticated"
          @click="toggleCollection"
          :class="[
            'btn px-4 md:px-6 py-2 md:py-3 text-sm md:text-base',
            isCollected ? 'btn-primary' : 'btn-outline'
          ]"
        >
          {{ isCollected ? '⭐ 已收藏' : '☆ 收藏' }}
        </button>
        <p v-else class="text-xs md:text-sm text-gray-500 dark:text-gray-400">
          登录后可收藏单词
        </p>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="text-center py-20">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-600 dark:text-gray-400">加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="text-center py-20">
      <div class="text-4xl mb-4">❌</div>
      <p class="text-red-600 dark:text-red-400 mb-4">{{ error }}</p>
      <button @click="loadRandomWord" class="btn btn-primary">
        重试
      </button>
    </div>

    <!-- 学习进度 -->
    <div v-if="learnedCount > 0" class="card text-center">
      <p class="text-sm md:text-base text-gray-600 dark:text-gray-400">
        本次已学习 <span class="text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">{{ learnedCount }}</span> 个单词
      </p>
      <button @click="loadRandomWord" class="btn btn-primary mt-3 md:mt-4 text-sm md:text-base">
        继续学习
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import WordCard from '@/components/WordCard.vue'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'
import { simpleQualityOptions } from '@/utils/sm2'

const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const currentWord = ref(null)
const loading = ref(false)
const error = ref(null)
const submitting = ref(false)
const learnedCount = ref(0)

const qualityOptions = simpleQualityOptions

const isCollected = computed(() => {
  if (!currentWord.value) return false
  return learningStore.isCollected(currentWord.value.word)
})

// 加载随机单词
async function loadRandomWord() {
  loading.value = true
  error.value = null
  
  try {
    const words = await dictionaryStore.loadRandomWords(1)
    if (words && words.length > 0) {
      const wordData = await dictionaryStore.getWordDetail(words[0].word)
      currentWord.value = wordData
    } else {
      error.value = '无法加载单词'
    }
  } catch (err) {
    error.value = '加载单词失败: ' + err.message
    console.error(err)
  } finally {
    loading.value = false
  }
}

// 标记单词
async function markWord(quality) {
  if (!currentWord.value || submitting.value) return

  submitting.value = true

  // 如果已登录，保存学习进度
  if (userStore.isAuthenticated) {
    const result = await learningStore.updateWordProgress(currentWord.value.word, quality)
    if (!result.success) {
      console.error('保存学习进度失败')
    }
  }

  learnedCount.value++
  submitting.value = false

  // 加载下一个单词
  setTimeout(() => {
    loadRandomWord()
  }, 300)
}

// 切换收藏状态
async function toggleCollection() {
  if (!currentWord.value || !userStore.isAuthenticated) return

  if (isCollected.value) {
    await learningStore.removeCollection(currentWord.value.word)
  } else {
    await learningStore.addCollection(currentWord.value.word)
  }
}

// 键盘快捷键处理
function handleKeyPress(e) {
  if (submitting.value) return
  
  // 数字键 1-3 对应掌握程度
  if (e.key >= '1' && e.key <= '3') {
    e.preventDefault()
    const qualityIndex = parseInt(e.key) - 1
    if (qualityIndex < qualityOptions.length) {
      markWord(qualityOptions[qualityIndex].value)
    }
  }
}

onMounted(() => {
  loadRandomWord()
  window.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress)
})
</script>

<style scoped>
/* 确保卡片容器有足够的空间，避免与按钮重叠 */
.word-card-wrapper {
  min-height: 500px;
  margin-bottom: 3rem;
  position: relative;
  z-index: 1;
}

@media (min-width: 768px) {
  .word-card-wrapper {
    min-height: 600px;
    margin-bottom: 4rem;
  }
}

/* 评分选择区域 */
.quality-selection {
  margin-top: 2rem;
  position: relative;
  z-index: 10;
  background-color: transparent;
  padding-top: 1rem;
}

@media (min-width: 768px) {
  .quality-selection {
    margin-top: 3rem;
    padding-top: 2rem;
  }
}
</style>

