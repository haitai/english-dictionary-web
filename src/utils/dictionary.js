/**
 * 词典工具函数 - 优化版
 * 采用按需加载 + 多层缓存策略
 */

import { openDB } from 'idb'

const BASE_URL = import.meta.env.BASE_URL

// 内存缓存
let indexCache = null
const wordCache = new Map() // 单词详情缓存
const MAX_MEMORY_CACHE = 200 // 最多缓存200个单词详情

// IndexedDB 配置
const DB_NAME = 'dictionary-cache'
const DB_VERSION = 1
const STORE_NAME = 'words'

let dbPromise = null

// 初始化 IndexedDB
function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'word' })
        }
      }
    })
  }
  return dbPromise
}

/**
 * 从 IndexedDB 获取单词
 */
async function getFromIndexedDB(word) {
  try {
    const db = await initDB()
    return await db.get(STORE_NAME, word)
  } catch (err) {
    console.warn('IndexedDB 读取失败:', err)
    return null
  }
}

/**
 * 保存到 IndexedDB
 */
async function saveToIndexedDB(word, data) {
  try {
    const db = await initDB()
    await db.put(STORE_NAME, { word, data, timestamp: Date.now() })
  } catch (err) {
    console.warn('IndexedDB 写入失败:', err)
  }
}

/**
 * 加载索引文件（只在启动时加载一次）
 */
export async function loadIndex() {
  if (indexCache) {
    return indexCache
  }

  try {
    const response = await fetch(`${BASE_URL}dictionary/index.json`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    indexCache = await response.json()
    console.log(`📚 索引加载成功: ${indexCache.totalWords} 个单词`)
    
    return indexCache
  } catch (error) {
    console.error('加载索引失败:', error)
    throw new Error('无法加载词典索引')
  }
}

/**
 * 按需加载单词详情（带缓存）
 */
export async function getWordDetail(word) {
  const normalizedWord = word.toLowerCase().trim()
  
  // 1. 检查内存缓存
  if (wordCache.has(normalizedWord)) {
    console.log(`🎯 从内存缓存加载: ${normalizedWord}`)
    return wordCache.get(normalizedWord)
  }
  
  // 2. 检查 IndexedDB 缓存
  const cachedData = await getFromIndexedDB(normalizedWord)
  if (cachedData?.data) {
    console.log(`💾 从 IndexedDB 加载: ${normalizedWord}`)
    
    // 更新内存缓存
    wordCache.set(normalizedWord, cachedData.data)
    
    // 控制内存缓存大小
    if (wordCache.size > MAX_MEMORY_CACHE) {
      const firstKey = wordCache.keys().next().value
      wordCache.delete(firstKey)
    }
    
    return cachedData.data
  }
  
  // 3. 从服务器加载
  try {
    console.log(`🌐 从服务器加载: ${normalizedWord}`)
    const response = await fetch(`${BASE_URL}dictionary/${normalizedWord}.json`)
    
    if (!response.ok) {
      throw new Error(`单词 "${word}" 不存在`)
    }
    
    const data = await response.json()
    
    // 保存到缓存
    wordCache.set(normalizedWord, data)
    saveToIndexedDB(normalizedWord, data) // 异步保存，不阻塞
    
    // 控制内存缓存大小
    if (wordCache.size > MAX_MEMORY_CACHE) {
      const firstKey = wordCache.keys().next().value
      wordCache.delete(firstKey)
    }
    
    return data
  } catch (error) {
    console.error('加载单词详情失败:', error)
    throw error
  }
}

/**
 * 搜索单词（从索引中搜索）
 */
export async function searchWords(query, limit = 20) {
  const index = await loadIndex()
  
  if (!query || !index?.words) {
    return []
  }
  
  const queryLower = query.toLowerCase().trim()
  const results = []
  
  // 精确匹配优先
  for (const item of index.words) {
    if (item.word.toLowerCase() === queryLower) {
      results.unshift(item)
    } else if (item.word.toLowerCase().startsWith(queryLower)) {
      results.push(item)
    }
    
    if (results.length >= limit) break
  }
  
  // 如果结果不够，添加包含查询的单词
  if (results.length < limit) {
    for (const item of index.words) {
      if (results.length >= limit) break
      
      if (!results.some(r => r.word === item.word) && 
          item.word.toLowerCase().includes(queryLower)) {
        results.push(item)
      }
    }
  }
  
  return results.slice(0, limit)
}

/**
 * 获取随机单词
 */
export async function getRandomWords(count = 10) {
  const index = await loadIndex()
  
  if (!index?.words || index.words.length === 0) {
    return []
  }
  
  const words = [...index.words]
  const selected = []
  
  for (let i = 0; i < Math.min(count, words.length); i++) {
    const randomIndex = Math.floor(Math.random() * words.length)
    selected.push(words[randomIndex])
    words.splice(randomIndex, 1)
  }
  
  return selected
}

/**
 * 预加载常用单词（后台执行）
 */
export function preloadCommonWords() {
  // 延迟执行，不阻塞主流程
  setTimeout(async () => {
    try {
      const commonWords = ['hello', 'world', 'love', 'time', 'good', 'people', 'year', 'work', 'make', 'life']
      
      for (const word of commonWords) {
        // 如果还没缓存，就预加载
        if (!wordCache.has(word)) {
          await getWordDetail(word)
          // 每次预加载后等待一下，避免一次性发太多请求
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      console.log('✅ 常用单词预加载完成')
    } catch (err) {
      console.warn('预加载失败:', err)
    }
  }, 2000) // 2秒后开始预加载
}

/**
 * 预加载热门字母组的单词（可选）
 */
export function preloadCommonGroups() {
  // 预加载高频字母开头的单词
  setTimeout(async () => {
    try {
      const index = await loadIndex()
      const commonLetters = ['a', 'b', 'c', 'd', 'e']
      
      for (const letter of commonLetters) {
        const wordsInGroup = index.words.filter(w => 
          w.word.charAt(0).toLowerCase() === letter
        ).slice(0, 10) // 每组只预加载前10个
        
        for (const wordInfo of wordsInGroup) {
          if (!wordCache.has(wordInfo.word)) {
            await getWordDetail(wordInfo.word)
            await new Promise(resolve => setTimeout(resolve, 50))
          }
        }
      }
      
      console.log('✅ 常用字母组预加载完成')
    } catch (err) {
      console.warn('预加载失败:', err)
    }
  }, 5000) // 5秒后开始
}

/**
 * 清除内存缓存
 */
export function clearCache() {
  indexCache = null
  wordCache.clear()
  console.log('✅ 内存缓存已清除')
}

/**
 * 清除 IndexedDB 缓存
 */
export async function clearIndexedDB() {
  try {
    const db = await initDB()
    await db.clear(STORE_NAME)
    console.log('✅ IndexedDB 缓存已清除')
  } catch (err) {
    console.error('清除 IndexedDB 失败:', err)
  }
}

/**
 * 获取缓存统计
 */
export async function getCacheStats() {
  try {
    const db = await initDB()
    const allKeys = await db.getAllKeys(STORE_NAME)
    
    return {
      memoryCache: wordCache.size,
      indexedDBCache: allKeys.length,
      total: wordCache.size + allKeys.length
    }
  } catch (err) {
    return {
      memoryCache: wordCache.size,
      indexedDBCache: 0,
      total: wordCache.size
    }
  }
}
