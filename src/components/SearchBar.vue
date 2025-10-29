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
        <button
          v-for="word in results"
          :key="word.word"
          @click="selectWord(word.word)"
          class="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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

const router = useRouter()
const dictionaryStore = useDictionaryStore()

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

