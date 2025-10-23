/**
 * 本地缓存工具
 * 使用 localStorage 缓存用户数据，减少 Supabase 请求
 */

const CACHE_PREFIX = 'dict_'
const CACHE_VERSION = 'v1'

/**
 * 缓存键生成
 */
function getCacheKey(userId, type) {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${userId}_${type}`
}

/**
 * 获取缓存数据
 */
export function getCache(userId, type) {
  if (!userId) return null
  
  try {
    const key = getCacheKey(userId, type)
    const cached = localStorage.getItem(key)
    
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    
    // 检查缓存是否过期（默认 1 小时）
    const maxAge = 60 * 60 * 1000 // 1 小时
    if (Date.now() - timestamp > maxAge) {
      localStorage.removeItem(key)
      return null
    }
    
    return data
  } catch (error) {
    console.error('读取缓存失败:', error)
    return null
  }
}

/**
 * 设置缓存数据
 */
export function setCache(userId, type, data) {
  if (!userId) return
  
  try {
    const key = getCacheKey(userId, type)
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(cacheData))
  } catch (error) {
    console.error('设置缓存失败:', error)
  }
}

/**
 * 清除特定缓存
 */
export function clearCache(userId, type) {
  if (!userId) return
  
  try {
    const key = getCacheKey(userId, type)
    localStorage.removeItem(key)
  } catch (error) {
    console.error('清除缓存失败:', error)
  }
}

/**
 * 清除用户所有缓存
 */
export function clearAllUserCache(userId) {
  if (!userId) return
  
  try {
    const prefix = `${CACHE_PREFIX}${CACHE_VERSION}_${userId}_`
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('清除所有缓存失败:', error)
  }
}

/**
 * 待同步队列管理
 */
const SYNC_QUEUE_KEY = `${CACHE_PREFIX}${CACHE_VERSION}_sync_queue`

/**
 * 添加到同步队列
 */
export function addToSyncQueue(userId, action, data) {
  try {
    const queue = getSyncQueue()
    queue.push({
      userId,
      action,
      data,
      timestamp: Date.now()
    })
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('添加同步队列失败:', error)
  }
}

/**
 * 获取同步队列
 */
export function getSyncQueue() {
  try {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  } catch (error) {
    console.error('获取同步队列失败:', error)
    return []
  }
}

/**
 * 清空同步队列
 */
export function clearSyncQueue() {
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY)
  } catch (error) {
    console.error('清空同步队列失败:', error)
  }
}

/**
 * 移除队列中的特定项
 */
export function removeFromSyncQueue(index) {
  try {
    const queue = getSyncQueue()
    queue.splice(index, 1)
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch (error) {
    console.error('移除同步队列项失败:', error)
  }
}

