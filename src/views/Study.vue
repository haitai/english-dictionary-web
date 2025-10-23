<template>
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        学习模式
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        选择单词开始学习，标记您的掌握程度
      </p>
    </div>

    <!-- 当前单词卡片 -->
    <div v-if="currentWord" class="mb-8">
      <WordCard :word="currentWord.word" :word-data="currentWord" />

      <!-- 操作按钮 -->
      <div class="mt-6 flex flex-col md:flex-row gap-4 justify-center">
        <button
          v-for="option in qualityOptions"
          :key="option.value"
          @click="markWord(option.value)"
          :class="[
            'btn flex-1 py-4 text-lg',
            option.color === 'red' && 'bg-red-500 hover:bg-red-600 text-white',
            option.color === 'yellow' && 'bg-yellow-500 hover:bg-yellow-600 text-white',
            option.color === 'green' && 'bg-green-500 hover:bg-green-600 text-white'
          ]"
          :disabled="submitting"
        >
          {{ option.label }}
          <span class="block text-sm opacity-80 mt-1">{{ option.description }}</span>
        </button>
      </div>

      <!-- 收藏按钮 -->
      <div class="mt-4 text-center">
        <button
          v-if="userStore.isAuthenticated"
          @click="toggleCollection"
          :class="[
            'btn',
            isCollected ? 'btn-primary' : 'btn-outline'
          ]"
        >
          {{ isCollected ? '⭐ 已收藏' : '☆ 收藏' }}
        </button>
        <p v-else class="text-sm text-gray-500 dark:text-gray-400">
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
      <p class="text-gray-600 dark:text-gray-400">
        本次已学习 <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ learnedCount }}</span> 个单词
      </p>
      <button @click="loadRandomWord" class="btn btn-primary mt-4">
        继续学习
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

onMounted(() => {
  loadRandomWord()
})
</script>

