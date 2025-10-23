<template>
  <div class="max-w-4xl mx-auto">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        智能英汉词典
      </h1>
      <p class="text-xl text-gray-600 dark:text-gray-400 mb-8">
        基于记忆曲线的科学学习方法，高效记忆单词
      </p>

      <!-- 搜索栏 -->
      <div class="max-w-2xl mx-auto mb-8">
        <SearchBar />
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div class="card text-center">
          <div class="text-3xl font-bold text-primary-600 dark:text-primary-400">
            {{ dictionaryStore.totalWords.toLocaleString() }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            词汇总量
          </div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ learningStore.stats.totalWords }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            已学单词
          </div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ learningStore.stats.learnedToday }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            今日学习
          </div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {{ learningStore.dueWords.length }}
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            待复习
          </div>
        </div>
      </div>
    </div>

    <!-- 快速开始 -->
    <div class="grid md:grid-cols-2 gap-6 mb-12">
      <router-link 
        to="/study"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center space-x-4">
          <div class="text-5xl">📖</div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              开始学习
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              浏览词汇库，学习新单词
            </p>
          </div>
          <span class="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </router-link>

      <router-link 
        v-if="userStore.isAuthenticated"
        to="/review"
        class="card hover:shadow-xl transition-shadow cursor-pointer group"
      >
        <div class="flex items-center space-x-4">
          <div class="text-5xl">🔄</div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              复习单词
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              根据记忆曲线复习
            </p>
          </div>
          <span class="text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </router-link>

      <div 
        v-else
        class="card opacity-50"
      >
        <div class="flex items-center space-x-4">
          <div class="text-5xl">🔄</div>
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              复习单词
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              请先登录
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 每日推荐 -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          随机单词
        </h2>
        <button 
          @click="loadRandomWords"
          :disabled="loading"
          class="btn btn-outline"
        >
          {{ loading ? '加载中...' : '换一批' }}
        </button>
      </div>

      <div v-if="loading" class="grid md:grid-cols-2 gap-4">
        <div v-for="i in 6" :key="i" class="skeleton h-24"></div>
      </div>

      <div v-else class="grid md:grid-cols-2 gap-4">
        <router-link
          v-for="word in randomWords"
          :key="word.word"
          :to="{ name: 'WordDetail', params: { word: word.word } }"
          class="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors cursor-pointer"
        >
          <div class="font-semibold text-lg text-gray-900 dark:text-gray-100">
            {{ word.word }}
            <span v-if="word.pronunciation" class="ml-2 text-sm text-gray-500 dark:text-gray-400">
              [{{ word.pronunciation }}]
            </span>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
            {{ word.concise_definition }}
          </div>
        </router-link>
      </div>
    </div>

    <!-- 功能特性 -->
    <div class="mt-16">
      <h2 class="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
        为什么选择我们
      </h2>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="text-center">
          <div class="text-5xl mb-4">🧠</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            科学记忆
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            基于 SM-2 算法的记忆曲线，让复习更高效
          </p>
        </div>
        <div class="text-center">
          <div class="text-5xl mb-4">☁️</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            跨端同步
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            学习进度云端同步，随时随地继续学习
          </p>
        </div>
        <div class="text-center">
          <div class="text-5xl mb-4">🎯</div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            详细释义
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            详尽的双语释义和例句，深入理解每个单词
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'

const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const randomWords = ref([])
const loading = ref(false)

async function loadRandomWords() {
  loading.value = true
  await dictionaryStore.loadRandomWords(6)
  randomWords.value = dictionaryStore.randomWords
  loading.value = false
}

onMounted(() => {
  loadRandomWords()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

