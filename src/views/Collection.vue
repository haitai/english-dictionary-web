<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        我的收藏
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        共收藏 {{ collectionList.length }} 个单词
      </p>
    </div>

    <!-- 搜索和筛选 -->
    <div class="card mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索收藏的单词..."
        class="input"
      />
    </div>

    <!-- 收藏列表 -->
    <div v-if="!loading && filteredCollections.length > 0" class="space-y-4">
      <div
        v-for="item in filteredCollections"
        :key="item.word"
        class="card hover:shadow-lg transition-shadow"
      >
        <div class="flex items-start justify-between">
          <router-link
            :to="{ name: 'WordDetail', params: { word: item.word } }"
            class="flex-1"
          >
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {{ item.word }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              收藏于 {{ formatDate(item.created_at) }}
            </p>
          </router-link>

          <button
            @click="removeFromCollection(item.word)"
            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="取消收藏"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && collectionList.length === 0" class="text-center py-20">
      <div class="text-6xl mb-4">📚</div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        还没有收藏
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-8">
        在学习时点击收藏按钮，将单词添加到这里
      </p>
      <router-link to="/study" class="btn btn-primary">
        去学习
      </router-link>
    </div>

    <!-- 搜索无结果 -->
    <div v-else-if="!loading && searchQuery && filteredCollections.length === 0" class="text-center py-20">
      <div class="text-4xl mb-4">🔍</div>
      <p class="text-gray-600 dark:text-gray-400">
        未找到包含 "{{ searchQuery }}" 的单词
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="skeleton h-24"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLearningStore } from '@/stores/learning'

const learningStore = useLearningStore()

const searchQuery = ref('')
const loading = ref(false)

const collectionList = computed(() => learningStore.collectionList)

const filteredCollections = computed(() => {
  if (!searchQuery.value) {
    return collectionList.value
  }
  const query = searchQuery.value.toLowerCase()
  return collectionList.value.filter(item =>
    item.word.toLowerCase().includes(query)
  )
})

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays} 天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

async function removeFromCollection(word) {
  if (confirm(`确定要取消收藏"${word}"吗？`)) {
    await learningStore.removeCollection(word)
  }
}

onMounted(async () => {
  loading.value = true
  await learningStore.loadCollections()
  loading.value = false
})
</script>

