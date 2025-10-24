/**
 * 音标获取工具
 * 优先使用免费在线服务，失败时回退到原始数据
 */

// 免费音标服务配置
const PHONETIC_SERVICES = [
  {
    name: 'Free Dictionary API',
    url: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    parse: (data) => {
      if (data && data[0] && data[0].phonetics) {
        // 优先选择有音频的音标
        const phonetic = data[0].phonetics.find(p => p.text && p.audio) || 
                        data[0].phonetics.find(p => p.text) ||
                        data[0].phonetics[0]
        return phonetic?.text || null
      }
      return null
    }
  },
  {
    name: 'WordsAPI (RapidAPI)',
    url: 'https://wordsapiv1.p.rapidapi.com/words',
    headers: {
      'X-RapidAPI-Key': 'your-rapidapi-key', // 需要注册获取
      'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com'
    },
    parse: (data) => {
      return data?.pronunciation?.all || data?.pronunciation?.noun || null
    }
  }
]

// 音标缓存
const phoneticCache = new Map()

/**
 * 获取单词音标
 * @param {string} word - 单词
 * @param {string} fallbackPhonetic - 原始数据中的音标（作为回退）
 * @returns {Promise<string|null>} 音标字符串
 */
export async function getPhonetic(word, fallbackPhonetic = null) {
  if (!word || typeof word !== 'string') {
    return fallbackPhonetic
  }

  const cacheKey = word.toLowerCase()
  
  // 检查缓存
  if (phoneticCache.has(cacheKey)) {
    return phoneticCache.get(cacheKey)
  }

  try {
    // 尝试从免费服务获取音标
    const phonetic = await fetchPhoneticFromServices(word)
    
    if (phonetic) {
      // 缓存结果
      phoneticCache.set(cacheKey, phonetic)
      return phonetic
    }
  } catch (error) {
    console.warn('获取音标失败，使用原始数据:', error.message)
  }

  // 回退到原始数据
  const result = fallbackPhonetic || null
  phoneticCache.set(cacheKey, result)
  return result
}

/**
 * 从多个服务尝试获取音标
 * @param {string} word - 单词
 * @returns {Promise<string|null>} 音标
 */
async function fetchPhoneticFromServices(word) {
  for (const service of PHONETIC_SERVICES) {
    try {
      const phonetic = await fetchPhoneticFromService(service, word)
      if (phonetic) {
        console.log(`从 ${service.name} 获取音标成功:`, phonetic)
        return phonetic
      }
    } catch (error) {
      console.warn(`${service.name} 获取音标失败:`, error.message)
      continue
    }
  }
  return null
}

/**
 * 从单个服务获取音标
 * @param {Object} service - 服务配置
 * @param {string} word - 单词
 * @returns {Promise<string|null>} 音标
 */
async function fetchPhoneticFromService(service, word) {
  const url = `${service.url}/${encodeURIComponent(word)}`
  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'English-Dictionary-App/1.0',
      ...service.headers
    }
  }

  const response = await fetch(url, options)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  return service.parse(data)
}

/**
 * 批量获取音标
 * @param {Array} words - 单词数组，格式: [{word: string, phonetic: string}]
 * @returns {Promise<Array>} 带音标的单词数组
 */
export async function getBatchPhonetics(words) {
  if (!Array.isArray(words)) {
    return []
  }

  const results = []
  
  // 并发获取音标（限制并发数避免请求过多）
  const batchSize = 5
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)
    const batchPromises = batch.map(async (item) => {
      const phonetic = await getPhonetic(item.word, item.phonetic)
      return {
        ...item,
        phonetic: phonetic || item.phonetic
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // 避免请求过于频繁
    if (i + batchSize < words.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

/**
 * 清理音标缓存
 */
export function clearPhoneticCache() {
  phoneticCache.clear()
}

/**
 * 获取缓存统计
 */
export function getPhoneticCacheStats() {
  return {
    size: phoneticCache.size,
    keys: Array.from(phoneticCache.keys())
  }
}

/**
 * 检查服务可用性
 * @returns {Promise<Object>} 服务状态
 */
export async function checkServicesStatus() {
  const status = {}
  
  for (const service of PHONETIC_SERVICES) {
    try {
      const testWord = 'hello'
      const url = `${service.url}/${encodeURIComponent(testWord)}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'English-Dictionary-App/1.0',
          ...service.headers
        }
      })
      
      status[service.name] = {
        available: response.ok,
        status: response.status,
        statusText: response.statusText
      }
    } catch (error) {
      status[service.name] = {
        available: false,
        error: error.message
      }
    }
  }
  
  return status
}
