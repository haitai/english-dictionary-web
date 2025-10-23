<template>
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        复习模式
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        根据记忆曲线复习需要巩固的单词
      </p>
    </div>

    <!-- 待复习单词列表 -->
    <div v-if="!reviewMode && dueWords.length > 0" class="space-y-4">
      <div class="card">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          今日待复习：{{ dueWords.length }} 个单词
        </h2>
        <button @click="startReview" class="btn btn-primary w-full py-3">
          开始复习
        </button>
      </div>

      <div class="card">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          待复习单词
        </h3>
        <div class="space-y-2">
          <div
            v-for="item in dueWords.slice(0, 10)"
            :key="item.word"
            class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center"
          >
            <span class="font-medium text-gray-900 dark:text-gray-100">
              {{ item.word }}
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatNextReview(item.next_review) }}
            </span>
          </div>
          <p v-if="dueWords.length > 10" class="text-sm text-gray-500 dark:text-gray-400 text-center pt-2">
            还有 {{ dueWords.length - 10 }} 个...
          </p>
        </div>
      </div>
    </div>

    <!-- 复习模式 -->
    <div v-else-if="reviewMode && currentWord" class="mb-8">
      <div class="mb-4 text-center">
        <div class="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full">
          <span class="text-primary-700 dark:text-primary-300 font-medium">
            进度: {{ reviewedCount }} / {{ totalDueWords }}
          </span>
        </div>
      </div>

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
    </div>

    <!-- 无待复习单词 -->
    <div v-else-if="!loading && dueWords.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">🎉</div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        太棒了！
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        暂时没有需要复习的单词
      </p>
      <router-link to="/study" class="btn btn-primary">
        去学习新单词
      </router-link>
    </div>

    <!-- 完成复习 -->
    <div v-else-if="reviewMode && !currentWord && reviewedCount > 0" class="text-center py-20">
      <div class="text-6xl mb-4">✅</div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        复习完成！
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        本次复习了 {{ reviewedCount }} 个单词
      </p>
      <button @click="exitReview" class="btn btn-primary">
        返回
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="text-center py-20">
      <div class="text-4xl mb-4">⏳</div>
      <p class="text-gray-600 dark:text-gray-400">加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import WordCard from '@/components/WordCard.vue'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { simpleQualityOptions, formatNextReview } from '@/utils/sm2'

const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()

const reviewMode = ref(false)
const currentWord = ref(null)
const currentIndex = ref(0)
const loading = ref(false)
const submitting = ref(false)
const reviewedCount = ref(0)
const totalDueWords = ref(0)

const qualityOptions = simpleQualityOptions

const dueWords = computed(() => learningStore.dueWords)

// 开始复习
async function startReview() {
  reviewMode.value = true
  currentIndex.value = 0
  reviewedCount.value = 0
  totalDueWords.value = dueWords.value.length
  await loadNextWord()
}

// 加载下一个单词
async function loadNextWord() {
  if (currentIndex.value >= dueWords.value.length) {
    currentWord.value = null
    return
  }

  loading.value = true
  
  try {
    const wordItem = dueWords.value[currentIndex.value]
    const wordData = await dictionaryStore.getWordDetail(wordItem.word)
    currentWord.value = wordData
  } catch (err) {
    console.error('加载单词失败:', err)
  } finally {
    loading.value = false
  }
}

// 标记单词
async function markWord(quality) {
  if (!currentWord.value || submitting.value) return

  submitting.value = true

  await learningStore.updateWordProgress(currentWord.value.word, quality)
  
  reviewedCount.value++
  currentIndex.value++
  submitting.value = false

  // 加载下一个单词
  setTimeout(() => {
    loadNextWord()
  }, 300)
}

// 退出复习
function exitReview() {
  reviewMode.value = false
  currentWord.value = null
  currentIndex.value = 0
  reviewedCount.value = 0
}

onMounted(async () => {
  loading.value = true
  await learningStore.loadDueWords()
  loading.value = false
})
</script>

