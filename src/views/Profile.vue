<template>
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        个人中心
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        {{ userStore.user?.email }}
      </p>
    </div>

    <!-- 学习统计 -->
    <div class="grid md:grid-cols-4 gap-4 mb-8">
      <div class="card text-center">
        <div class="text-4xl font-bold text-primary-600 dark:text-primary-400">
          {{ stats.totalWords }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          总学习单词
        </div>
      </div>

      <div class="card text-center">
        <div class="text-4xl font-bold text-green-600 dark:text-green-400">
          {{ stats.masteredWords }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          已掌握
        </div>
      </div>

      <div class="card text-center">
        <div class="text-4xl font-bold text-blue-600 dark:text-blue-400">
          {{ stats.learnedToday }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          今日学习
        </div>
      </div>

      <div class="card text-center">
        <div class="text-4xl font-bold text-orange-600 dark:text-orange-400">
          {{ stats.dueWords }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400 mt-2">
          待复习
        </div>
      </div>
    </div>

    <!-- 学习进度图表 -->
    <div v-if="chartData.length > 0" class="mb-8">
      <ProgressChart :data="chartData" />
    </div>

    <!-- 最近学习 -->
    <div class="card mb-8">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        最近学习
      </h2>

      <div v-if="recentWords.length > 0" class="space-y-3">
        <div
          v-for="item in recentWords"
          :key="item.word"
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <router-link
            :to="{ name: 'WordDetail', params: { word: item.word } }"
            class="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
          >
            {{ item.word }}
          </router-link>
          <div class="text-right">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              复习 {{ item.repetitions }} 次
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-500">
              {{ formatNextReview(item.next_review) }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
        暂无学习记录
      </div>
    </div>

    <!-- 数据同步状态 -->
    <div class="card mb-8">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        数据同步
      </h2>

      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center gap-3">
            <span class="text-2xl">
              {{ learningStore.isSyncing ? '🔄' : '✅' }}
            </span>
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">
                {{ learningStore.isSyncing ? '正在同步...' : '数据已同步' }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                使用本地缓存，减少网络请求
              </div>
            </div>
          </div>
          <button
            @click="handleManualSync"
            :disabled="learningStore.isSyncing"
            class="btn btn-outline"
          >
            {{ learningStore.isSyncing ? '同步中' : '手动同步' }}
          </button>
        </div>

         <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="flex items-start gap-2">
            <span class="text-lg">💡</span>
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <div class="font-medium mb-1">智能缓存机制</div>
              <ul class="space-y-1 text-blue-700 dark:text-blue-300">
                <li>• 用户数据：本地优先，自动同步</li>
                <li>• 词典数据：按需加载，永久缓存</li>
                <li>• 已缓存单词：{{ cacheStats.total }} 个</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 账号操作 -->
    <div class="card">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        账号设置
      </h2>

      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <div class="font-medium text-gray-900 dark:text-gray-100">
              邮箱地址
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ userStore.user?.email }}
            </div>
          </div>
        </div>

        <button
          @click="handleClearCache"
          class="w-full btn btn-outline"
        >
          清除本地缓存
        </button>

        <button
          @click="handleSignOut"
          class="w-full btn bg-red-500 hover:bg-red-600 text-white"
        >
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useLearningStore } from '@/stores/learning'
import ProgressChart from '@/components/ProgressChart.vue'
import { formatNextReview } from '@/utils/sm2'
import { clearCache as clearDictCache, clearIndexedDB, getCacheStats } from '@/utils/dictionary'

const router = useRouter()
const userStore = useUserStore()
const learningStore = useLearningStore()

const cacheStats = ref({ memoryCache: 0, indexedDBCache: 0, total: 0 })

const stats = computed(() => learningStore.stats)

const recentWords = computed(() => {
  return [...learningStore.progressList]
    .sort((a, b) => new Date(b.last_reviewed) - new Date(a.last_reviewed))
    .slice(0, 10)
})

// 图表数据（最近7天）
const chartData = ref([])

function generateChartData() {
  const data = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dateString = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    
    const count = learningStore.progressList.filter(p => {
      const reviewDate = new Date(p.last_reviewed)
      return reviewDate >= startOfDay && reviewDate < endOfDay
    }).length
    
    data.push({
      date: dateString,
      count
    })
  }
  
  chartData.value = data
}

async function handleSignOut() {
  if (confirm('确定要退出登录吗？')) {
    await userStore.signOut()
    router.push('/')
  }
}

async function handleManualSync() {
  await learningStore.syncWithServer()
}

async function handleClearCache() {
  if (confirm('清除缓存后将从服务器重新加载数据，确定继续吗？')) {
    try {
      // 清除用户数据缓存
      learningStore.clearUserData()
      
      // 清除词典缓存
      clearDictCache()
      await clearIndexedDB()
      
      // 重新加载
      await learningStore.loadCollections()
      await learningStore.loadProgress()
      await learningStore.loadStats()
      
      // 更新缓存统计
      cacheStats.value = await getCacheStats()
      
      alert('缓存已清除！')
    } catch (err) {
      console.error('清除缓存失败:', err)
      alert('清除缓存失败，请刷新页面重试')
    }
  }
}

onMounted(async () => {
  await learningStore.loadProgress()
  await learningStore.loadStats()
  generateChartData()
  
  // 加载缓存统计
  cacheStats.value = await getCacheStats()
})
</script>

