/**
 * 文本转语音 (TTS) 工具
 * 使用浏览器原生 Web Speech API
 */

import { getSpeakSettings, shouldAutoSpeak } from '@/utils/settings'

const DEFAULT_LANG = 'en-US'
const DEFAULT_SPEED = 1.0

/**
 * 播放单词发音
 * @param {string} text - 要发音的文本
 * @param {string} lang - 语言代码 (默认: 'en-US')
 * @param {number} speed - 语速 (0.1-2.0, 默认: 1.0)
 * @returns {Promise<boolean>} 是否成功播放
 */
export async function speakText(text, lang = DEFAULT_LANG, speed = DEFAULT_SPEED) {
  if (!text || typeof text !== 'string') {
    return false
  }

  // 检查浏览器是否支持 Web Speech API
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('浏览器不支持 Web Speech API')
    return false
  }

  try {
    return await speakWithWebSpeechAPI(text, lang, speed)
  } catch (error) {
    console.warn('TTS 播放失败:', error)
    return false
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

    utterance.onend = () => resolve(true)
    utterance.onerror = (error) => {
      console.warn('Web Speech API 错误:', error)
      resolve(false)
    }

    speechSynthesis.speak(utterance)
  })
}

/**
 * 使用 Google TTS 播放（备用方案）
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
      
      // 设置超时保护（3秒）
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          audio.pause()
          audio.src = ''
          isResolved = true
          resolve(false)
        }
      }, 3000)
      
      audio.onloadeddata = () => {
        if (!isResolved) {
          audio.play().then(() => {
            if (!isResolved) {
              clearTimeout(timeoutId)
              isResolved = true
              resolve(true)
            }
          }).catch((error) => {
            if (!isResolved) {
              clearTimeout(timeoutId)
              isResolved = true
              resolve(false)
            }
          })
        }
      }
      
      audio.onerror = (error) => {
        if (!isResolved) {
          clearTimeout(timeoutId)
          isResolved = true
          resolve(false)
        }
      }
      
      audio.onended = () => {
        if (!isResolved) {
          clearTimeout(timeoutId)
          isResolved = true
          resolve(true)
        }
      }
      
      // 设置音频属性
      audio.preload = 'auto'
      audio.crossOrigin = 'anonymous'
      audio.src = url
    })
  } catch (error) {
    console.warn('Google TTS 请求失败:', error)
    return false
  }
}

/**
 * 停止当前播放
 */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}

/**
 * 检查是否正在播放
 */
export function isSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return speechSynthesis.speaking
  }
  return false
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const voices = speechSynthesis.getVoices()
    return voices.map(voice => ({
      lang: voice.lang,
      name: voice.name,
      localService: voice.localService
    }))
  }
  return [
    { lang: 'en-US', name: '英语 (美式)', localService: false },
    { lang: 'en-GB', name: '英语 (英式)', localService: false },
    { lang: 'zh-CN', name: '中文 (普通话)', localService: false }
  ]
}

/**
 * 预加载语音
 */
export function preloadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // 触发语音列表加载
    speechSynthesis.getVoices()
    
    // 监听语音列表变化
    speechSynthesis.addEventListener('voiceschanged', () => {
      const voices = speechSynthesis.getVoices()
      console.log('Web Speech API 语音已加载:', voices.length, '个语音')
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

  // 检查页面是否完全加载
  if (document.readyState !== 'complete') {
    // 如果页面还在加载，等待加载完成
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve()
      } else {
        window.addEventListener('load', resolve, { once: true })
      }
    })
  }

  // 额外延迟，确保页面渲染完成
  await new Promise(resolve => setTimeout(resolve, 500))

  const settings = getSpeakSettings()
  const lang = options.lang || settings.language
  const speed = options.speed || settings.speed

  try {
    await speakText(text, lang, speed)
    return true
  } catch (error) {
    console.warn('自动朗读失败:', error)
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

  // 检查页面是否完全加载
  if (document.readyState !== 'complete') {
    // 如果页面还在加载，等待加载完成
    await new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve()
      } else {
        window.addEventListener('load', resolve, { once: true })
      }
    })
  }

  // 额外延迟，确保页面渲染完成
  await new Promise(resolve => setTimeout(resolve, 200))

  const settings = getSpeakSettings()
  const lang = options.lang || settings.language
  const speed = options.speed || settings.speed

  try {
    await speakText(text, lang, speed)
    return true
  } catch (error) {
    console.warn('朗读句子失败:', error)
    return false
  }
}

/**
 * 停止所有朗读
 */
export function stopAllSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speechSynthesis.cancel()
  }
}
