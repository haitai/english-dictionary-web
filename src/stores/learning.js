import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { collections, progress } from '@/utils/supabase'
import { calculateNextReview } from '@/utils/sm2'
import { getCache, setCache, clearAllUserCache, addToSyncQueue, getSyncQueue, removeFromSyncQueue } from '@/utils/cache'
import { useUserStore } from './user'

export const useLearningStore = defineStore('learning', () => {
  const userStore = useUserStore()

  const collectionList = ref([])
  const progressList = ref([])
  const stats = ref({
    totalWords: 0,
    learnedToday: 0,
    dueWords: 0,
    masteredWords: 0
  })
  const loading = ref(false)
  const error = ref(null)
  const isSyncing = ref(false)

  const dueWords = computed(() => {
    const now = new Date()
    return progressList.value.filter(p => new Date(p.next_review) <= now)
  })

  const collectedWords = computed(() => 
    collectionList.value.map(c => c.word)
  )

  // 监听用户变化，加载缓存或清除数据
  watch(() => userStore.user, (newUser, oldUser) => {
    if (newUser && newUser.id !== oldUser?.id) {
      loadFromCache()
      syncWithServer()
    } else if (!newUser) {
      // 用户登出，清除内存数据
      collectionList.value = []
      progressList.value = []
      stats.value = {
        totalWords: 0,
        learnedToday: 0,
        dueWords: 0,
        masteredWords: 0
      }
    }
  })

  // 从本地缓存加载数据
  function loadFromCache() {
    if (!userStore.user) return

    const userId = userStore.user.id
    
    // 加载收藏缓存
    const cachedCollections = getCache(userId, 'collections')
    if (cachedCollections) {
      collectionList.value = cachedCollections
    }
    
    // 加载进度缓存
    const cachedProgress = getCache(userId, 'progress')
    if (cachedProgress) {
      progressList.value = cachedProgress
      calculateStats()
    }
  }

  // 保存到本地缓存
  function saveToCache() {
    if (!userStore.user) return

    const userId = userStore.user.id
    setCache(userId, 'collections', collectionList.value)
    setCache(userId, 'progress', progressList.value)
  }

  // 计算统计数据（本地计算，无需请求服务器）
  function calculateStats() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    stats.value = {
      totalWords: progressList.value.length,
      learnedToday: progressList.value.filter(p => {
        if (!p.last_reviewed) return false
        const lastReviewed = new Date(p.last_reviewed)
        return lastReviewed >= today
      }).length,
      dueWords: progressList.value.filter(p => new Date(p.next_review) <= now).length,
      masteredWords: progressList.value.filter(p => p.repetitions >= 5).length
    }
  }

  // 与服务器同步
  async function syncWithServer() {
    if (!userStore.user || isSyncing.value) return

    isSyncing.value = true
    
    try {
      // 先处理待同步队列
      await processSyncQueue()
      
      // 等待一小段时间确保服务器端处理完成
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 然后从服务器拉取最新数据
      await Promise.all([
        syncCollections(),
        syncProgress()
      ])
      
      // 保存到本地缓存
      saveToCache()
    } catch (err) {
      console.error('同步失败:', err)
    } finally {
      isSyncing.value = false
    }
  }

  // 同步收藏列表
  async function syncCollections() {
    try {
      const { data, error: err } = await collections.getCollections(userStore.user.id)
      if (err) throw err
      collectionList.value = data || []
    } catch (err) {
      console.error('同步收藏失败:', err)
    }
  }

  // 同步学习进度
  async function syncProgress() {
    try {
      const { data, error: err } = await progress.getProgress(userStore.user.id)
      if (err) throw err
      progressList.value = data || []
      calculateStats()
    } catch (err) {
      console.error('同步进度失败:', err)
    }
  }

  // 处理同步队列
  async function processSyncQueue() {
    const queue = getSyncQueue()
    
    for (let i = queue.length - 1; i >= 0; i--) {
      const item = queue[i]
      
      // 只处理当前用户的队列
      if (item.userId !== userStore.user.id) continue
      
      try {
        if (item.action === 'addCollection') {
          await collections.addCollection(item.userId, item.data.word)
        } else if (item.action === 'removeCollection') {
          await collections.removeCollection(item.userId, item.data.word)
        } else if (item.action === 'updateProgress') {
          await progress.updateProgress(item.userId, item.data.word, item.data.progressData)
        }
        
        // 成功后从队列移除
        removeFromSyncQueue(i)
      } catch (err) {
        console.error('同步队列项失败:', err)
        // 保留在队列中，下次重试
      }
    }
  }

  // 加载收藏列表（直接从服务器）
  async function loadCollections() {
    if (!userStore.user) return

    try {
      const { data, error: err } = await collections.getCollections(userStore.user.id)
      if (err) throw err
      
      collectionList.value = data || []
      saveToCache()
    } catch (err) {
      console.error('加载收藏失败:', err)
      // 失败时尝试从缓存加载
      loadFromCache()
    }
  }

  // 添加收藏（直接同步）
  async function addCollection(word) {
    if (!userStore.user) {
      error.value = '请先登录'
      return { success: false }
    }

    try {
      // 直接调用服务器
      const { data, error: err } = await collections.addCollection(userStore.user.id, word)
      if (err) throw err

      // 服务器成功后更新本地状态
      const newItem = {
        word,
        created_at: new Date().toISOString()
      }
      collectionList.value.unshift(newItem)
      
      // 保存到缓存
      saveToCache()

      console.log('成功添加收藏:', word)
      return { success: true }
    } catch (err) {
      console.error('添加收藏失败:', err)
      return { success: false, error: err }
    }
  }

  // 移除收藏（直接同步）
  async function removeCollection(word) {
    if (!userStore.user) return { success: false }

    try {
      // 直接调用服务器
      const { data, error: err } = await collections.removeCollection(userStore.user.id, word)
      if (err) throw err

      // 服务器成功后更新本地状态
      collectionList.value = collectionList.value.filter(c => c.word !== word)
      
      // 保存到缓存
      saveToCache()

      console.log('成功取消收藏:', word)
      return { success: true }
    } catch (err) {
      console.error('取消收藏失败:', err)
      return { success: false, error: err }
    }
  }

  // 检查是否已收藏
  function isCollected(word) {
    return collectedWords.value.includes(word)
  }

  // 加载学习进度（直接从服务器）
  async function loadProgress() {
    if (!userStore.user) return

    try {
      const { data, error: err } = await progress.getProgress(userStore.user.id)
      if (err) throw err
      
      progressList.value = data || []
      calculateStats()
      saveToCache()
    } catch (err) {
      console.error('加载进度失败:', err)
      // 失败时尝试从缓存加载
      loadFromCache()
    }
  }

  // 更新单词学习进度（乐观更新 + 后台同步）
  async function updateWordProgress(word, quality) {
    if (!userStore.user) {
      error.value = '请先登录'
      return { success: false }
    }

    try {
      // 查找当前进度
      const existingProgress = progressList.value.find(p => p.word === word)
      
      // 计算新的复习参数
      const newData = calculateNextReview(
        existingProgress?.ease_factor || 2.5,
        existingProgress?.interval || 0,
        existingProgress?.repetitions || 0,
        quality
      )

      // 立即更新本地状态（乐观更新）
      const index = progressList.value.findIndex(p => p.word === word)
      if (index >= 0) {
        progressList.value[index] = { 
          ...progressList.value[index], 
          ...newData,
          last_reviewed: new Date().toISOString()
        }
      } else {
        progressList.value.push({
          word,
          user_id: userStore.user.id,
          ...newData,
          last_reviewed: new Date().toISOString()
        })
      }

      // 重新计算统计
      calculateStats()
      
      // 保存到缓存
      saveToCache()

      // 添加到同步队列
      addToSyncQueue(userStore.user.id, 'updateProgress', { 
        word, 
        progressData: newData 
      })

      // 后台同步
      setTimeout(() => {
        processSyncQueue().catch(err => {
          console.error('后台同步失败:', err)
        })
      }, 100)

      return { success: true, data: newData }
    } catch (err) {
      error.value = '更新学习进度失败: ' + err.message
      console.error(err)
      return { success: false }
    }
  }

  // 加载统计数据（从本地计算，无需请求）
  async function loadStats() {
    calculateStats()
  }

  // 获取待复习单词
  async function loadDueWords() {
    if (!userStore.user) return

    // 先从缓存加载
    loadFromCache()

    // 后台同步
    syncWithServer()
  }

  // 清除错误
  function clearError() {
    error.value = null
  }

  // 清除用户数据和缓存
  function clearUserData() {
    if (userStore.user) {
      clearAllUserCache(userStore.user.id)
    }
    collectionList.value = []
    progressList.value = []
    stats.value = {
      totalWords: 0,
      learnedToday: 0,
      dueWords: 0,
      masteredWords: 0
    }
  }

  return {
    collectionList,
    progressList,
    stats,
    dueWords,
    collectedWords,
    loading,
    error,
    isSyncing,
    loadCollections,
    addCollection,
    removeCollection,
    isCollected,
    loadProgress,
    updateWordProgress,
    loadStats,
    loadDueWords,
    syncWithServer,
    clearError,
    clearUserData
  }
})
