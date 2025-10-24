/**
 * 文本转语音 (TTS) 工具
 * 使用 Web Speech API 和 Google Text-to-Speech API
 */

import { getSpeakSettings, shouldAutoSpeak } from '@/utils/settings'

// Google TTS API 配置
const GOOGLE_TTS_URL = 'https://translate.google.com/translate_tts'
const DEFAULT_LANG = 'en'
const DEFAULT_SPEED = 1.0

// 地理位置检测
let chinaRegionCache = null
let chinaRegionCheckTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 检测是否在中国大陆地区
 * @returns {Promise<boolean>} 是否在中国大陆
 */
async function checkChinaRegion() {
  const now = Date.now()
  
  // 使用缓存结果
  if (chinaRegionCache !== null && (now - chinaRegionCheckTime) < CACHE_DURATION) {
    return chinaRegionCache
  }

  try {
    // 方法1: 检查时区
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Chongqing')) {
      chinaRegionCache = true
      chinaRegionCheckTime = now
      return true
    }

    // 方法2: 检查语言设置
    const language = navigator.language || navigator.languages[0]
    if (language.startsWith('zh-CN')) {
      chinaRegionCache = true
      chinaRegionCheckTime = now
      return true
    }

    // 方法3: 检查网络延迟（简单检测）
    const startTime = Date.now()
    try {
      await fetch('https://www.google.com', { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      })
      const latency = Date.now() - startTime
      
      // 如果访问 Google 延迟很高，可能在中国大陆
      if (latency > 3000) {
        chinaRegionCache = true
        chinaRegionCheckTime = now
        return true
      }
    } catch (error) {
      // 如果无法访问 Google，可能在中国大陆
      chinaRegionCache = true
      chinaRegionCheckTime = now
      return true
    }

    chinaRegionCache = false
    chinaRegionCheckTime = now
    return false
  } catch (error) {
    console.warn('TTS: 地理位置检测失败，使用默认策略:', error.message)
    chinaRegionCache = false
    chinaRegionCheckTime = now
    return false
  }
}

/**
 * 播放单词发音
 * @param {string} text - 要发音的文本
 * @param {string} lang - 语言代码 (默认: 'en')
 * @param {number} speed - 语速 (0.1-2.0, 默认: 1.0)
 * @returns {Promise<boolean>} 是否成功播放
 */
export async function speakText(text, lang = DEFAULT_LANG, speed = DEFAULT_SPEED) {
  if (!text || typeof text !== 'string') {
    console.warn('TTS: 无效的文本输入')
    return false
  }

  // 检查浏览器支持
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('TTS: 浏览器不支持 SpeechSynthesis API')
    return false
  }

  // 检查网络状态和地理位置
  const isChinaRegion = await checkChinaRegion()
  
  // 在中国大陆环境下，优先使用 Google TTS
  if (isChinaRegion) {
    console.log('TTS: 检测到中国大陆环境，优先使用 Google TTS')
    try {
      return await speakWithGoogleTTS(text, lang)
    } catch (error) {
      console.warn('TTS: Google TTS 失败，尝试 Web Speech API:', error.message)
      try {
        return await speakWithWebSpeechAPI(text, lang, speed)
      } catch (webError) {
        console.error('TTS: 所有发音服务都失败:', webError.message)
        return false
      }
    }
  }

  // 其他地区优先使用 Web Speech API
  try {
    return await speakWithWebSpeechAPI(text, lang, speed)
  } catch (error) {
    console.warn('TTS: Web Speech API 失败，尝试 Google TTS:', error.message)
    try {
      return await speakWithGoogleTTS(text, lang)
    } catch (googleError) {
      console.error('TTS: 所有发音服务都失败:', googleError.message)
      return false
    }
  }
}

/**
 * 使用 Web Speech API 播放
 */
async function speakWithWebSpeechAPI(text, lang, speed) {
  return new Promise((resolve) => {
    // 停止当前播放
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = speed
    utterance.volume = 0.8

    let isResolved = false
    let timeoutId = null

    // 设置超时（3秒）
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        console.warn('TTS: Web Speech API 超时')
        speechSynthesis.cancel()
        isResolved = true
        resolve(false)
      }
    }, 3000)

    utterance.onstart = () => {
      console.log('TTS: Web Speech API 开始播放')
    }

    utterance.onend = () => {
      if (!isResolved) {
        console.log('TTS: Web Speech API 播放完成')
        clearTimeout(timeoutId)
        isResolved = true
        resolve(true)
      }
    }

    utterance.onerror = (error) => {
      if (!isResolved) {
        console.warn('TTS: Web Speech API 错误:', error.error)
        clearTimeout(timeoutId)
        isResolved = true
        
        // 根据错误类型决定是否重试
        if (error.error === 'interrupted' || error.error === 'not-allowed') {
          console.log('TTS: 语音被中断或不允许，尝试降级到 Google TTS')
          resolve(false) // 返回 false，让上层函数尝试降级
        } else {
          resolve(false)
        }
      }
    }

    utterance.onpause = () => {
      console.log('TTS: Web Speech API 播放暂停')
    }

    utterance.onresume = () => {
      console.log('TTS: Web Speech API 播放恢复')
    }

    // 开始播放
    try {
      speechSynthesis.speak(utterance)
    } catch (speakError) {
      console.error('TTS: speak 调用失败', speakError)
      clearTimeout(timeoutId)
      if (!isResolved) {
        isResolved = true
        resolve(false)
      }
    }
  })
}

/**
 * 使用 Google TTS 播放
 */
async function speakWithGoogleTTS(text, lang) {
  try {
    // 创建音频元素
    const audio = new Audio()
    
    // 构建 Google TTS URL
    const params = new URLSearchParams({
      ie: 'UTF-8',
      q: text,
      tl: lang,
      client: 'tw-ob'
    })
    
    const url = `${GOOGLE_TTS_URL}?${params.toString()}`
    
    return new Promise((resolve) => {
      let isResolved = false
      let timeoutId = null

      // 设置超时（5秒）
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          console.warn('TTS: Google TTS 超时')
          audio.pause()
          audio.src = ''
          isResolved = true
          resolve(false)
        }
      }, 5000)

      audio.onloadeddata = () => {
        if (!isResolved) {
          console.log('TTS: Google TTS 音频加载完成')
          audio.play().then(() => {
            if (!isResolved) {
              clearTimeout(timeoutId)
              isResolved = true
              resolve(true)
            }
          }).catch((error) => {
            console.error('TTS: 音频播放失败:', error)
            clearTimeout(timeoutId)
            if (!isResolved) {
              isResolved = true
              resolve(false)
            }
          })
        }
      }
      
      audio.oncanplaythrough = () => {
        if (!isResolved) {
          console.log('TTS: Google TTS 音频可以播放')
          audio.play().then(() => {
            if (!isResolved) {
              clearTimeout(timeoutId)
              isResolved = true
              resolve(true)
            }
          }).catch((error) => {
            console.error('TTS: 音频播放失败:', error)
            clearTimeout(timeoutId)
            if (!isResolved) {
              isResolved = true
              resolve(false)
            }
          })
        }
      }
      
      audio.onerror = (error) => {
        console.error('TTS: Google TTS 错误:', error)
        clearTimeout(timeoutId)
        if (!isResolved) {
          isResolved = true
          resolve(false)
        }
      }

      audio.onended = () => {
        if (!isResolved) {
          console.log('TTS: Google TTS 播放完成')
          clearTimeout(timeoutId)
          isResolved = true
          resolve(true)
        }
      }
      
      // 设置音频属性
      audio.preload = 'auto'
      audio.crossOrigin = 'anonymous'
      
      try {
        audio.src = url
      } catch (srcError) {
        console.error('TTS: 设置音频源失败:', srcError)
        clearTimeout(timeoutId)
        if (!isResolved) {
          isResolved = true
          resolve(false)
        }
      }
    })
  } catch (error) {
    console.error('Google TTS 请求失败:', error)
    return false
  }
}

/**
 * 停止当前播放
 */
export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

/**
 * 检查是否正在播放
 */
export function isSpeaking() {
  if ('speechSynthesis' in window) {
    return speechSynthesis.speaking
  }
  return false
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages() {
  if ('speechSynthesis' in window) {
    return speechSynthesis.getVoices().map(voice => ({
      lang: voice.lang,
      name: voice.name,
      localService: voice.localService
    }))
  }
  return []
}

/**
 * 预加载语音
 */
export function preloadVoices() {
  if ('speechSynthesis' in window) {
    // 触发语音列表加载
    speechSynthesis.getVoices()
    
    // 监听语音列表变化
    speechSynthesis.addEventListener('voiceschanged', () => {
      console.log('语音列表已加载:', getSupportedLanguages().length, '个语音')
    })
  }
}

/**
 * 自动朗读功能
 * @param {string} text - 要朗读的文本
 * @param {string} context - 上下文 ('wordDetail', 'study', 'search')
 * @param {Object} options - 选项
 */
export async function autoSpeak(text, context, options = {}) {
  if (!text || !shouldAutoSpeak(context)) {
    return false
  }

  const settings = getSpeakSettings()
  const lang = options.lang || settings.language
  const speed = options.speed || settings.speed

  try {
    // 使用静默模式，避免错误信息影响用户体验
    return await speakTextSilently(text, lang, speed)
  } catch (error) {
    // 静默失败，不显示错误
    return false
  }
}

/**
 * 朗读句子
 * @param {string} text - 要朗读的句子
 * @param {Object} options - 选项
 */
export async function speakSentence(text, options = {}) {
  if (!text) return false

  const settings = getSpeakSettings()
  const lang = options.lang || settings.language
  const speed = options.speed || settings.speed

  try {
    // 使用静默模式，避免错误信息影响用户体验
    return await speakTextSilently(text, lang, speed)
  } catch (error) {
    // 静默失败，不显示错误
    return false
  }
}

/**
 * 停止所有朗读
 */
export function stopAllSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

/**
 * 静默播放（不显示错误信息）
 * @param {string} text - 要发音的文本
 * @param {string} lang - 语言代码
 * @param {number} speed - 语速
 * @returns {Promise<boolean>} 是否成功播放
 */
export async function speakTextSilently(text, lang = DEFAULT_LANG, speed = DEFAULT_SPEED) {
  if (!text || typeof text !== 'string') {
    return false
  }

  // 检查浏览器支持
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false
  }

  try {
    // 优先使用 Web Speech API
    return await speakWithWebSpeechAPI(text, lang, speed)
  } catch (error) {
    try {
      // 降级到 Google TTS
      return await speakWithGoogleTTS(text, lang)
    } catch (googleError) {
      // 静默失败，不显示错误
      return false
    }
  }
}

/**
 * 检查 TTS 服务状态
 * @returns {Object} 服务状态
 */
export function checkTTSStatus() {
  const status = {
    webSpeechAPI: false,
    googleTTS: false,
    networkOnline: navigator.onLine,
    voices: 0
  }

  // 检查 Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    status.webSpeechAPI = true
    status.voices = speechSynthesis.getVoices().length
  }

  // 检查网络状态
  status.networkOnline = navigator.onLine

  return status
}
