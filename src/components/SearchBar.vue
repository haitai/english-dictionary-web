<template>
  <div class="relative">
    <div class="relative">
      <input
        v-model="searchQuery"
        @input="handleSearch"
        @focus="showResults = true"
        type="text"
        placeholder="搜索单词..."
        class="input pr-10"
      />
      <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-2xl">
        🔍
      </span>
    </div>

    <!-- 搜索结果下拉框 -->
    <div 
      v-if="showResults && (results.length > 0 || loading)"
      class="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700"
    >
      <!-- 加载中 -->
      <div v-if="loading" class="p-4 text-center text-gray-500">
        加载中...
      </div>

      <!-- 搜索结果 -->
      <div v-else>
        <div
          v-for="word in results"
          :key="word.word"
          class="group border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="px-4 py-3 flex items-start justify-between gap-3">
            <button
              @click="selectWord(word.word)"
              class="flex-1 text-left"
            >
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ word.word }}
                <span v-if="word.pronunciation" class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  [{{ word.pronunciation }}]
                </span>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                {{ word.concise_definition }}
              </div>
            </button>
            <button
              @click.stop="addToLearning(word.word)"
              :disabled="learningStore.isInProgress(word.word)"
              class="px-3 py-2 text-xs rounded-lg transition-colors flex items-center gap-1"
              :class="learningStore.isInProgress(word.word) 
                ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 cursor-not-allowed' 
                : 'bg-gray-100 hover:bg-primary-100 dark:bg-gray-700 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'"
              :title="learningStore.isInProgress(word.word) ? '已在学习中' : '加入学习'"
            >
              <span>{{ learningStore.isInProgress(word.word) ? '✓' : '📖' }}</span>
              <span class="hidden sm:inline">{{ learningStore.isInProgress(word.word) ? '已学' : '学习' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 点击外部关闭 -->
    <div 
      v-if="showResults"
      @click="showResults = false"
      class="fixed inset-0 z-0"
    ></div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDictionaryStore } from '@/stores/dictionary'
import { useLearningStore } from '@/stores/learning'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const dictionaryStore = useDictionaryStore()
const learningStore = useLearningStore()
const userStore = useUserStore()

const searchQuery = ref('')
const showResults = ref(false)
const loading = ref(false)

const results = ref([])

let searchTimeout = null

// 搜索处理（防抖）
function handleSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchQuery.value.trim()) {
    results.value = []
    return
  }

  loading.value = true
  searchTimeout = setTimeout(async () => {
    await dictionaryStore.search(searchQuery.value)
    results.value = dictionaryStore.searchResults
    loading.value = false
  }, 300)
}

// 选择单词
function selectWord(word) {
  showResults.value = false
  searchQuery.value = ''
  results.value = []
  router.push({ name: 'WordDetail', params: { word } })
}

// 加入学习
async function addToLearning(word) {
  if (!word) return
  
  // 检查是否已登录
  if (!userStore.isAuthenticated) {
    alert('请先登录以使用此功能')
    router.push('/auth')
    return
  }
  
  // 检查是否已经在学习中
  if (learningStore.isInProgress(word)) {
    alert('该单词已经在学习列表中')
    return
  }
  
  try {
    // 使用质量分数 1（不认识）添加单词
    const result = await learningStore.updateWordProgress(word, 1)
    if (result.success) {
      alert('已加入学习！')
    } else {
      alert('加入学习失败，请重试')
    }
  } catch (error) {
    console.error('加入学习失败:', error)
    alert('加入学习失败，请重试')
  }
}

// 监听搜索结果变化
watch(() => dictionaryStore.searchResults, (newResults) => {
  results.value = newResults
})
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

